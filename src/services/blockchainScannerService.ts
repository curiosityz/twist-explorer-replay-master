
import { toast } from 'sonner';
import { chainstackService } from './chainstackService';
import { processTransactions } from './transactionService';
import { analyzeTransaction } from '@/lib/vulnerability';

/**
 * Service to scan blockchain blocks and look for vulnerable transactions
 */
export class BlockchainScannerService {
  private isScanning = false;
  private shouldStop = false;
  private currentHeight = 0;
  private startHeight = 0;
  private endHeight = 0;
  private processedCount = 0;
  private vulnerableCount = 0;
  private statusCallback: ((status: ScanningStatus) => void) | null = null;
  private consecutiveErrorCount = 0;
  private maxConsecutiveErrors = 5;

  /**
   * Start scanning the blockchain for vulnerable transactions
   * @param startHeight Block height to start scanning from
   * @param endHeight Block height to end scanning at
   * @param statusCallback Callback to report scanning status
   */
  async startScanning(
    startHeight: number, 
    endHeight: number,
    statusCallback?: (status: ScanningStatus) => void
  ): Promise<void> {
    // Don't start if already scanning
    if (this.isScanning) {
      toast.error("Scanner is already running");
      return;
    }

    this.isScanning = true;
    this.shouldStop = false;
    this.startHeight = startHeight;
    this.endHeight = endHeight;
    this.currentHeight = startHeight;
    this.processedCount = 0;
    this.vulnerableCount = 0;
    this.statusCallback = statusCallback || null;
    this.consecutiveErrorCount = 0;

    toast.success("Starting blockchain scan", {
      description: `Scanning blocks ${startHeight} to ${endHeight}`
    });

    this._updateStatus();

    try {
      // Process blocks in batches
      await this.processBlockRange();
    } catch (error) {
      console.error("Scanning error:", error);
      toast.error("Scanning failed", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      this.isScanning = false;
      this._updateStatus();

      toast.success("Scan complete", {
        description: `Processed ${this.processedCount} transactions, found ${this.vulnerableCount} vulnerabilities`
      });
    }
  }

  /**
   * Stop the current scanning operation
   */
  stopScanning(): void {
    if (!this.isScanning) return;
    
    this.shouldStop = true;
    toast.info("Stopping scan after current block...");
  }

  /**
   * Get the current scanning status
   */
  getStatus(): ScanningStatus {
    return {
      isScanning: this.isScanning,
      currentBlock: this.currentHeight,
      startBlock: this.startHeight,
      endBlock: this.endHeight,
      processedCount: this.processedCount,
      vulnerableCount: this.vulnerableCount,
      progress: this.calculateProgress()
    };
  }

  /**
   * Calculate the scan progress percentage
   */
  private calculateProgress(): number {
    if (this.startHeight === this.endHeight) return 100;
    const progress = ((this.currentHeight - this.startHeight) / (this.endHeight - this.startHeight)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  /**
   * Update the status via callback if available
   */
  private _updateStatus(): void {
    if (this.statusCallback) {
      this.statusCallback(this.getStatus());
    }
  }

  /**
   * Process a range of blocks from startHeight to endHeight
   */
  private async processBlockRange(): Promise<void> {
    for (let height = this.startHeight; height <= this.endHeight; height++) {
      if (this.shouldStop) {
        console.log("Scanning stopped by user");
        break;
      }

      this.currentHeight = height;
      this._updateStatus();

      try {
        // Get block hash for this height
        const blockHash = await this.getBlockHashByHeight(height);
        if (!blockHash) {
          console.warn(`Could not get hash for block at height ${height}, skipping...`);
          this.consecutiveErrorCount++;
          
          if (this.consecutiveErrorCount >= this.maxConsecutiveErrors) {
            toast.error("Too many consecutive errors", {
              description: "Stopping scan to prevent further issues"
            });
            break;
          }
          
          continue;
        }

        // Reset consecutive error count when successful
        this.consecutiveErrorCount = 0;

        // Get full block data
        const blockData = await this.getBlockByHash(blockHash);
        if (!blockData || !blockData.tx || !Array.isArray(blockData.tx)) {
          console.warn(`Invalid block data for block ${height}, skipping...`);
          continue;
        }

        // Process all transactions in the block
        console.log(`Processing block ${height} with ${blockData.tx.length} transactions`);
        
        // Process transactions in smaller batches to avoid overwhelming the browser
        const batchSize = 5;
        for (let i = 0; i < blockData.tx.length; i += batchSize) {
          const batch = blockData.tx.slice(i, i + batchSize);
          await this.processTransactionBatch(batch);
          
          // Update status after each batch
          this._updateStatus();
          
          if (this.shouldStop) break;
        }
      } catch (error) {
        console.error(`Error processing block ${height}:`, error);
        this.consecutiveErrorCount++;
        
        if (this.consecutiveErrorCount >= this.maxConsecutiveErrors) {
          toast.error("Too many consecutive errors", {
            description: "Stopping scan to prevent further issues"
          });
          break;
        }
      }
    }
  }

  /**
   * Process a batch of transactions
   * @param txids Array of transaction IDs to process
   */
  private async processTransactionBatch(txids: string[]): Promise<void> {
    // Store transactions in the database
    const result = await processTransactions(txids);
    this.processedCount += result.successCount;

    // Analyze each transaction for vulnerabilities
    for (const txid of result.validTxids) {
      try {
        const analysisResult = await analyzeTransaction(txid);
        
        if (analysisResult && analysisResult.vulnerabilityType !== 'none') {
          this.vulnerableCount++;
          console.log(`Found vulnerable transaction: ${txid}`);
          toast.success("Vulnerability found!", {
            description: `TXID: ${txid.substring(0, 8)}...${txid.substring(txid.length - 8)}`
          });
        }
      } catch (error) {
        // Just log errors and continue
        console.error(`Error analyzing transaction ${txid}:`, error);
      }
    }
  }

  /**
   * Get block hash by height using blockchain API with retries
   * @param height Block height
   * @returns Block hash or null if not found
   */
  private async getBlockHashByHeight(height: number): Promise<string | null> {
    try {
      return await chainstackService.getBlockHashByHeight(height);
    } catch (error) {
      console.error(`Failed to get block hash for height ${height} after retries:`, error);
      return null;
    }
  }

  /**
   * Get full block data by hash using blockchain API with retries
   * @param blockHash Block hash
   * @returns Block data or null if not found
   */
  private async getBlockByHash(blockHash: string): Promise<any | null> {
    try {
      return await chainstackService.getBlockByHash(blockHash);
    } catch (error) {
      console.error(`Failed to get block data for hash ${blockHash} after retries:`, error);
      return null;
    }
  }
}

// Export a singleton instance
export const blockchainScannerService = new BlockchainScannerService();

// Define the status interface
export interface ScanningStatus {
  isScanning: boolean;
  currentBlock: number;
  startBlock: number;
  endBlock: number;
  processedCount: number;
  vulnerableCount: number;
  progress: number;
}
