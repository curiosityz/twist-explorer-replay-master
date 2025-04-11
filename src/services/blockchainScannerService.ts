import { toast } from 'sonner';
import { chainstackService, ChainStackService } from './chainstackService';
import { processTransactions } from './transactionService';
import { analyzeTransaction } from '@/lib/vulnerability';
import { extractSegWitData } from '@/lib/vulnerability/extraction/segwit/segWitExtractorCore';

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
  private chainStackService: ChainStackService;

  constructor() {
    this.chainStackService = chainstackService;
  }

  /**
   * Set a custom chainstack service
   * @param service The custom chainstack service
   */
  setChainStackService(service: ChainStackService): void {
    this.chainStackService = service;
    console.log("ChainStack service updated with custom configuration");
  }

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
        console.log(`Processing block at height ${height}`);
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
        console.log(`Getting full block data for hash ${blockHash}`);
        const blockData = await this.getBlockByHash(blockHash);
        if (!blockData || !blockData.tx || !Array.isArray(blockData.tx)) {
          console.warn(`Invalid block data for block ${height}, skipping...`);
          continue;
        }

        // Process all transactions in the block
        console.log(`Processing block ${height} with ${blockData.tx.length} transactions`);
        
        // Display a notification about scanning block
        if (height % 3 === 0) {  // Show notification every few blocks
          toast.info(`Scanning block ${height}`, {
            description: `Found ${blockData.tx.length} transactions to analyze`,
            duration: 2000
          });
        }
        
        // Process transactions in smaller batches to avoid overwhelming the browser
        const batchSize = 5;
        for (let i = 0; i < blockData.tx.length; i += batchSize) {
          const batch = blockData.tx.slice(i, i + batchSize);
          
          // Extract transaction IDs correctly based on the structure
          const txBatch = batch.map((tx: any) => {
            // Support different API formats
            return typeof tx === 'string' ? tx : tx.txid || tx.hash || tx;
          });
          
          await this.processTransactionBatch(txBatch, blockData);
          
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
   * @param blockData Full block data for context
   */
  private async processTransactionBatch(txids: string[], blockData: any): Promise<void> {
    console.log(`Processing batch of ${txids.length} transactions`);
    // Store transactions in the database
    const result = await processTransactions(txids);
    this.processedCount += result.successCount;

    // Show info on how many transactions are being processed
    if (this.processedCount % 20 === 0) {
      toast.info(`Processing transactions`, { 
        description: `Processed ${this.processedCount} transactions so far`
      });
    }

    // Enhanced: Analyze each transaction for vulnerabilities
    for (const txid of txids) {
      try {
        // Check if transaction object exists in the blockData
        // Handle different formats of blockchain API responses
        let tx: any;
        
        if (typeof blockData.tx[0] === 'string') {
          // If txids are stored directly in the array
          tx = { txid: txid };
        } else {
          // Look up by txid or hash
          tx = blockData.tx.find((t: any) => 
            (t.txid === txid || t.hash === txid || t === txid)
          );
          
          // If tx is a string, create a simple object
          if (typeof tx === 'string') {
            tx = { txid: tx };
          }
        }
        
        if (!tx) {
          console.warn(`Transaction ${txid} not found in block data`);
          continue;
        }

        console.log(`Checking transaction ${txid} for witness data...`);
        
        // Check if this transaction has inputs with witness data
        if (tx.vin && Array.isArray(tx.vin)) {
          let potentialVulnerability = false;
          
          // Check each input for witness data
          for (const input of tx.vin) {
            // Look for witness data under various field names used by different APIs
            const witnessData = input.txinwitness || input.witness || input.scriptWitness;
            
            if (witnessData && Array.isArray(witnessData) && witnessData.length > 0) {
              console.log(`Found witness data in input for transaction ${txid}, analyzing...`);
              
              // Try to extract data from witness
              try {
                // Extract cryptographic data from witness
                const extractedData = extractSegWitData(witnessData);
                
                if (extractedData && extractedData.publicKey) {
                  console.log("Successfully extracted cryptographic data:", {
                    publicKeyX: extractedData.publicKey.x.substring(0, 10) + "...",
                    isOnCurve: extractedData.publicKey.isOnCurve || "unknown"
                  });
                  
                  // Check if public key is not on curve (potential vulnerability)
                  if (extractedData.publicKey && !extractedData.publicKey.isOnCurve) {
                    potentialVulnerability = true;
                    console.log(`Potential vulnerability found in transaction ${txid} - public key not on curve!`);
                    
                    toast.info("Potential vulnerability detected!", {
                      description: `Transaction ${txid.substring(0, 8)}... has public key not on curve`,
                      duration: 5000
                    });
                    
                    // Perform full analysis on this transaction
                    toast.loading(`Analyzing potentially vulnerable transaction...`, {
                      id: `analyzing-${txid}`
                    });
                    
                    try {
                      const analysisResult = await analyzeTransaction(txid);
                      toast.dismiss(`analyzing-${txid}`);
                      
                      if (analysisResult && analysisResult.vulnerabilityType !== 'none') {
                        this.vulnerableCount++;
                        
                        console.log(`VULNERABILITY CONFIRMED: ${txid} - ${analysisResult.vulnerabilityType}`);
                        toast.success("Vulnerability confirmed!", {
                          description: `TXID: ${txid.substring(0, 8)}...${txid.substring(txid.length - 8)}`,
                          duration: 8000
                        });
                        
                        // Pause briefly for each vulnerability to allow user to see the notification
                        if (this.vulnerableCount % 3 === 0) {
                          toast.info("Scan paused briefly to review findings", {
                            description: "Continuing in 5 seconds..."
                          });
                          
                          await new Promise(resolve => setTimeout(resolve, 5000));
                        }
                      } else {
                        console.log(`False positive: Transaction ${txid} is not vulnerable`);
                      }
                    } catch (analysisError) {
                      console.error(`Error analyzing transaction ${txid}:`, analysisError);
                      toast.dismiss(`analyzing-${txid}`);
                      toast.error("Analysis failed", {
                        description: "Could not complete vulnerability check"
                      });
                    }
                    
                    break; // Break after analyzing one input with potential vulnerability
                  }
                }
              } catch (extractError) {
                console.error(`Error extracting SegWit data from ${txid}:`, extractError);
              }
            }
          }
          
          // If no potential vulnerability was found in the previous check, do a more thorough analysis 
          // on a small percentage of transactions as random sampling
          if (!potentialVulnerability && Math.random() < 0.05) { // 5% chance
            console.log(`Random sampling: Analyzing transaction ${txid}`);
            try {
              const analysisResult = await analyzeTransaction(txid);
              
              if (analysisResult && analysisResult.vulnerabilityType !== 'none') {
                this.vulnerableCount++;
                console.log(`Random check found vulnerability in ${txid}!`);
                
                toast.success("Random check found vulnerability!", {
                  description: `TXID: ${txid.substring(0, 8)}...${txid.substring(txid.length - 8)}`
                });
              }
            } catch (error) {
              console.error(`Error in random analysis of transaction ${txid}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Error analyzing transaction ${txid}:`, error);
      }
    }
  }

  /**
   * Get block hash by height using the configured chainstack service
   * @param height Block height
   * @returns Block hash or null if not found
   */
  private async getBlockHashByHeight(height: number): Promise<string | null> {
    try {
      return await this.chainStackService.getBlockHashByHeight(height);
    } catch (error) {
      console.error(`Failed to get block hash for height ${height}:`, error);
      return null;
    }
  }

  /**
   * Get full block data by hash using the configured chainstack service
   * @param blockHash Block hash
   * @returns Block data or null if not found
   */
  private async getBlockByHash(blockHash: string): Promise<any | null> {
    try {
      return await this.chainStackService.getBlockByHash(blockHash);
    } catch (error) {
      console.error(`Failed to get block data for hash ${blockHash}:`, error);
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
