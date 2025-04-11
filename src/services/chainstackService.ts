/**
 * ChainStack API service for blockchain interactions
 * Prioritizes direct ChainStack RPC calls over other APIs
 */

import { UTXO, TxInput, TxOutput } from '@/lib/walletUtils';
import { toast } from 'sonner';
import { safeFetch, shouldUseProxy } from './corsProxyService';

// Replace DEFAULT_RPC_ENDPOINT with Chainstack endpoint if user has configured one
const DEFAULT_RPC_ENDPOINT = 'https://rpc.chainstack.com/api/v1/bitcoin';

interface ChainStackConfig {
  rpcUrl: string;
  apiKey?: string;
  proxyUrl?: string;
  useCorsProxy?: boolean;
}

export class ChainStackService {
  private rpcUrl: string;
  private apiKey: string | undefined;
  private proxyUrl: string | undefined;
  private useCorsProxy: boolean;
  private fallbackEnabled: boolean = true;
  
  constructor(config?: ChainStackConfig) {
    this.rpcUrl = config?.rpcUrl || DEFAULT_RPC_ENDPOINT;
    this.apiKey = config?.apiKey;
    this.proxyUrl = config?.proxyUrl;
    this.useCorsProxy = config?.useCorsProxy !== undefined ? config.useCorsProxy : true;
    
    // Remove any trailing slashes for consistency
    this.rpcUrl = this.rpcUrl.replace(/\/$/, '');
    
    console.log(`ChainStack service initialized with URL: ${this.rpcUrl}, CORS proxy ${this.useCorsProxy ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Makes an RPC call to the blockchain node
   * @param method RPC method name
   * @param params Parameters for the RPC call
   * @returns Response from the node
   */
  public async rpcCall(method: string, params: any[] = []): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      headers['x-api-key'] = this.apiKey;
    }
    
    try {
      console.log(`Making RPC call to ${this.rpcUrl}: ${method} with params:`, params);
      
      const fetchFunction = this.useCorsProxy ? safeFetch : fetch;
      
      // Direct RPC call to the node
      const response = await fetchFunction(this.rpcUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method,
          params
        }),
        mode: 'cors',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`RPC error: ${data.error.message || JSON.stringify(data.error)}`);
      }
      
      return data.result;
    } catch (error: any) {
      console.error(`ChainStack RPC error (${method}):`, error);
      
      // Only use fallbacks if enabled
      if (this.fallbackEnabled) {
        // For getblockhash and getblock methods, try fallbacks
        if (method === 'getblockhash' && params.length > 0) {
          return this.fallbackGetBlockHashByHeight(params[0]);
        } else if (method === 'getblock' && params.length > 0) {
          return this.fallbackGetBlockByHash(params[0]);
        } else if (method === 'getrawtransaction' && params.length > 0) {
          return this.fallbackGetTransaction(params[0]);
        }
      }
      
      throw error;
    }
  }

  /**
   * Disable fallback to other APIs (use only Chainstack)
   */
  public disableFallback(): void {
    this.fallbackEnabled = false;
    console.log("Fallback to other APIs disabled - using only Chainstack");
  }

  /**
   * Enable fallback to other APIs
   */
  public enableFallback(): void {
    this.fallbackEnabled = true;
    console.log("Fallback to other APIs enabled");
  }
  
  /**
   * Fallback implementation for getrawtransaction using blockchain.info API
   */
  private async fallbackGetTransaction(txid: string): Promise<any> {
    try {
      console.warn("Failed to get transaction via RPC, falling back to blockchain.info:", txid);
      
      // Use a CORS proxy for blockchain.info requests
      const url = `https://blockchain.info/rawtx/${txid}?format=json`;
      const data = await this.fetchData(url);
      
      if (!data) {
        throw new Error(`Transaction not found: ${txid}`);
      }
      
      // Convert blockchain.info format to a format more similar to bitcoind RPC
      return {
        txid: data.hash,
        version: data.ver,
        locktime: data.lock_time,
        size: data.size,
        hex: data.hex || '', // blockchain.info may not provide hex
        vin: data.inputs.map((input: any) => ({
          txid: input.prev_out?.hash,
          vout: input.prev_out?.n,
          scriptSig: {
            asm: '',
            hex: input.script
          },
          sequence: input.sequence,
          // Handle witness data properly in the conversion
          witness: input.witness,
          // Ensure witness data is in a consistent format for our extraction code
          txinwitness: input.witness ? 
            (Array.isArray(input.witness) ? input.witness : [input.witness]) : 
            undefined
        })),
        vout: data.out.map((output: any, index: number) => ({
          value: output.value / 100000000, // satoshi to BTC
          n: index,
          scriptPubKey: {
            asm: '',
            hex: output.script,
            type: output.type || 'unknown',
            addresses: output.addr ? [output.addr] : undefined
          }
        })),
        blocktime: data.time,
        confirmations: data.block_height ? 1 : 0 // simplified
      };
    } catch (error) {
      console.error(`Fallback getTransaction failed:`, error);
      throw error;
    }
  }
  
  /**
   * Fallback implementation for getblockhash using blockchain.info API
   */
  private async fallbackGetBlockHashByHeight(height: number): Promise<string> {
    try {
      const url = `https://blockchain.info/block-height/${height}?format=json`;
      console.log(`Using fallback blockchain.info API: ${url}`);
      
      const fetchFunction = this.useCorsProxy ? safeFetch : fetch;
      const response = await fetchFunction(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data?.blocks && data.blocks.length > 0) {
        return data.blocks[0].hash;
      }
      throw new Error(`No block found at height ${height}`);
    } catch (error) {
      console.error(`Fallback getblockhash failed:`, error);
      throw error;
    }
  }
  
  /**
   * Fallback implementation for getblock using blockchain.info API
   */
  private async fallbackGetBlockByHash(blockHash: string): Promise<any> {
    try {
      const url = `https://blockchain.info/rawblock/${blockHash}`;
      console.log(`Using fallback blockchain.info API: ${url}`);
      
      const fetchFunction = this.useCorsProxy ? safeFetch : fetch;
      const response = await fetchFunction(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert blockchain.info format to bitcoind-like format
      return {
        hash: data.hash,
        height: data.height,
        version: data.ver,
        time: data.time,
        previousblockhash: data.prev_block,
        tx: data.tx.map((tx: any) => {
          // If this is a full tx object, convert it
          if (typeof tx === 'object') {
            return {
              txid: tx.hash,
              vin: tx.inputs.map((input: any) => ({
                txid: input.prev_out?.hash,
                vout: input.prev_out?.n,
                scriptSig: { hex: input.script },
                witness: input.witness,
                txinwitness: input.witness ? 
                  (Array.isArray(input.witness) ? input.witness : [input.witness]) : 
                  undefined
              })),
              vout: tx.out.map((output: any, idx: number) => ({
                value: output.value / 100000000,
                n: idx,
                scriptPubKey: { hex: output.script }
              }))
            };
          } else {
            // If it's just a txid
            return tx;
          }
        })
      };
    } catch (error) {
      console.error(`Fallback getblock failed:`, error);
      throw error;
    }
  }
  
  /**
   * Helper method to make a GET request
   * @param url URL to fetch
   * @returns Response data
   */
  private async fetchData(url: string): Promise<any> {
    try {
      const fetchFunction = this.useCorsProxy || shouldUseProxy(url) ? safeFetch : fetch;
      const response = await fetchFunction(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      throw error;
    }
  }
  
  /**
   * Initialize with custom configuration
   * @param config ChainStack configuration
   * @returns New ChainStackService instance
   */
  initializeWithConfig(config: ChainStackConfig): ChainStackService {
    return new ChainStackService(config);
  }

  /**
   * Gets the current block height directly from the node
   * @returns Current block height
   */
  async getBlockHeight(): Promise<number> {
    try {
      // Try direct RPC call first
      try {
        const blockchainInfo = await this.rpcCall('getblockchaininfo', []);
        return blockchainInfo.blocks;
      } catch (rpcError) {
        console.warn("Failed to get blockheight via RPC, falling back to blockchain.info:", rpcError);
        // Fallback to blockchain.info
        const result = await fetch('https://blockchain.info/q/getblockcount');
        const text = await result.text();
        return parseInt(text, 10);
      }
    } catch (error) {
      console.error("Failed to get block height:", error);
      throw error;
    }
  }
  
  /**
   * Gets UTXOs for a specific address first via RPC, falling back to blockchain.info API
   * @param address Bitcoin address
   * @returns Array of UTXOs
   */
  async getAddressUtxos(address: string): Promise<UTXO[]> {
    try {
      // Try direct RPC call first
      try {
        // Note: This requires an index on the node (addressindex=1)
        const result = await this.rpcCall('getaddressutxos', [{ addresses: [address] }]);
        
        if (Array.isArray(result)) {
          return result.map((utxo: any) => ({
            txid: utxo.txid,
            vout: utxo.outputIndex,
            value: utxo.satoshis,
            scriptPubKey: utxo.script,
            address: address,
            confirmations: utxo.confirmations || 0
          }));
        }
      } catch (rpcError) {
        console.warn("Failed to get UTXOs via RPC, falling back to blockchain.info:", rpcError);
      }
      
      // Fallback to blockchain.info
      const response = await fetch(`https://blockchain.info/unspent?active=${address}`);
      
      if (!response.ok) {
        if (response.status === 500 && await response.text() === "No free outputs to spend") {
          return [];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.unspent_outputs.map((utxo: any) => ({
        txid: utxo.tx_hash_big_endian,
        vout: utxo.tx_output_n,
        value: utxo.value,
        scriptPubKey: utxo.script,
        address: address,
        confirmations: utxo.confirmations || 0
      }));
    } catch (error) {
      console.error(`Failed to get UTXOs for address ${address}:`, error);
      return [];
    }
  }
  
  /**
   * Gets balance for an address first via RPC, falling back to blockchain.info API
   * @param address Bitcoin address
   * @returns Balance in BTC
   */
  async getAddressBalance(address: string): Promise<number> {
    try {
      // Try direct RPC call first
      try {
        // Note: This requires an index on the node (addressindex=1)
        const result = await this.rpcCall('getaddressbalance', [{ addresses: [address] }]);
        return (result.balance + result.received) / 100000000; // Convert satoshis to BTC
      } catch (rpcError) {
        console.warn("Failed to get balance via RPC, falling back to blockchain.info:", rpcError);
      }
      
      // Fallback to blockchain.info
      const response = await fetch(`https://blockchain.info/balance?active=${address}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const totalSatoshis = data[address]?.final_balance || 0;
      return totalSatoshis / 100000000; // Convert satoshis to BTC
    } catch (error) {
      console.error(`Failed to get balance for address ${address}:`, error);
      throw error;
    }
  }
  
  /**
   * Broadcasts a signed transaction to the network using RPC, falling back to blockchain.info
   * @param txHex Signed transaction in hex format
   * @returns Transaction ID if successful
   */
  async broadcastTransaction(txHex: string): Promise<string> {
    try {
      // Try direct RPC call first
      try {
        const txid = await this.rpcCall('sendrawtransaction', [txHex]);
        return txid;
      } catch (rpcError) {
        console.warn("Failed to broadcast via RPC, falling back to blockchain.info:", rpcError);
      }
      
      // Fallback to blockchain.info
      const response = await fetch('https://blockchain.info/pushtx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `tx=${txHex}`
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return "Transaction submitted successfully";
    } catch (error) {
      console.error("Failed to broadcast transaction:", error);
      throw error;
    }
  }
  
  /**
   * Creates a raw transaction via RPC
   * @param inputs Transaction inputs (UTXOs to spend)
   * @param outputs Transaction outputs (recipients)
   * @returns Raw transaction hex
   */
  async createRawTransaction(inputs: TxInput[], outputs: TxOutput[]): Promise<string> {
    try {
      // Format inputs for RPC
      const rpcInputs = inputs.map(input => ({
        txid: input.txid,
        vout: input.vout
      }));
      
      // Format outputs for RPC
      const rpcOutputs: Record<string, number> = {};
      outputs.forEach(output => {
        if (output.address) {
          rpcOutputs[output.address] = output.value;
        }
      });
      
      // Call createrawtransaction RPC method
      return await this.rpcCall('createrawtransaction', [rpcInputs, rpcOutputs]);
    } catch (error) {
      console.error("Failed to create raw transaction:", error);
      throw new Error("Creating raw transactions requires a full Bitcoin node with RPC access. Please configure a valid node endpoint.");
    }
  }
  
  /**
   * Gets transaction details using RPC, optimized to use Chainstack first
   * @param txid Transaction ID
   * @returns Transaction details
   */
  async getTransaction(txid: string): Promise<any> {
    try {
      // Always try direct Chainstack RPC call first
      console.log(`Getting transaction data for: ${txid}`);
      try {
        const txData = await this.rpcCall('getrawtransaction', [txid, true]);
        return txData;
      } catch (rpcError) {
        // If fallback is disabled, don't try other APIs
        if (!this.fallbackEnabled) {
          throw rpcError;
        }
        
        console.warn("Failed to get transaction via RPC, falling back to blockchain.info:", rpcError);
      }
      
      // Fallback to blockchain.info API with CORS handling
      return await this.fallbackGetTransaction(txid);
    } catch (error) {
      console.error(`Failed to get transaction details for ${txid}:`, error);
      throw error;
    }
  }

  /**
   * Gets block hash by height, optimized to use Chainstack first
   * @param height Block height
   * @returns Block hash or null if not found
   */
  async getBlockHashByHeight(height: number): Promise<string | null> {
    try {
      // Try direct RPC call
      try {
        console.log(`Getting block hash at height ${height} from ${this.rpcUrl}`);
        const blockHash = await this.rpcCall('getblockhash', [height]);
        return blockHash;
      } catch (rpcError) {
        // If fallback is disabled, don't try other APIs
        if (!this.fallbackEnabled) {
          throw rpcError;
        }
        
        console.warn("Failed to get block hash via RPC, falling back to blockchain.info:", rpcError);
      }
      
      // Fallback to blockchain.info
      return await this.fallbackGetBlockHashByHeight(height);
    } catch (error) {
      console.error(`Failed to get block hash for height ${height}:`, error);
      return null;
    }
  }

  /**
   * Gets full block data by hash, optimized to use Chainstack first
   * @param blockHash Block hash
   * @returns Block data or null if not found
   */
  async getBlockByHash(blockHash: string): Promise<any | null> {
    try {
      // Try direct RPC call
      try {
        console.log(`Getting block data for hash ${blockHash} from ${this.rpcUrl}`);
        const blockData = await this.rpcCall('getblock', [blockHash, 2]);
        return blockData;
      } catch (rpcError) {
        // If fallback is disabled, don't try other APIs
        if (!this.fallbackEnabled) {
          throw rpcError;
        }
        
        console.warn("Failed to get block via RPC, falling back to blockchain.info:", rpcError);
      }
      
      // Fallback to blockchain.info
      return await this.fallbackGetBlockByHash(blockHash);
    } catch (error) {
      console.error(`Failed to get block data for hash ${blockHash}:`, error);
      return null;
    }
  }
  
  /**
   * Gets current fee estimates via RPC, falling back to bitcoinfees.earn.com
   * @returns Fee estimates in satoshis/vbyte
   */
  async estimateFee(): Promise<{high: number, medium: number, low: number}> {
    try {
      // Try direct RPC call first
      try {
        const highPriority = await this.rpcCall('estimatesmartfee', [1]);
        const mediumPriority = await this.rpcCall('estimatesmartfee', [6]);
        const lowPriority = await this.rpcCall('estimatesmartfee', [24]);
        
        // Convert BTC/kB to satoshis/vbyte
        return {
          high: Math.round((highPriority.feerate || 0.0002) * 100000), // BTC/kB to sat/vB
          medium: Math.round((mediumPriority.feerate || 0.0001) * 100000),
          low: Math.round((lowPriority.feerate || 0.00005) * 100000)
        };
      } catch (rpcError) {
        console.warn("Failed to estimate fee via RPC, falling back to bitcoinfees.earn.com:", rpcError);
      }
      
      // Fallback to bitcoinfees.earn.com
      const response = await fetch('https://bitcoinfees.earn.com/api/v1/fees/recommended');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        high: data.fastestFee,
        medium: data.halfHourFee,
        low: data.hourFee
      };
    } catch (error) {
      console.error("Failed to estimate fees:", error);
      // Return reasonable defaults
      return {
        high: 50,
        medium: 25,
        low: 10
      };
    }
  }
}

/**
 * Initialize a ChainStack service with configuration
 * @param config Configuration for ChainStack service
 * @returns Configured ChainStack service
 */
export const initializeChainStack = (config: ChainStackConfig): ChainStackService => {
  return new ChainStackService(config);
};

// Create a default instance
export const chainstackService = new ChainStackService();
