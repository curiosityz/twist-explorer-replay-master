/**
 * ChainStack API service for blockchain interactions
 */

import { UTXO, TxInput, TxOutput } from '@/lib/walletUtils';
import { toast } from 'sonner';

// Default RPC endpoint for Bitcoin (this should be overridden by user configuration)
const DEFAULT_RPC_ENDPOINT = 'https://blockchain.info';

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
  
  constructor(config?: ChainStackConfig) {
    this.rpcUrl = config?.rpcUrl || DEFAULT_RPC_ENDPOINT;
    this.apiKey = config?.apiKey;
    this.proxyUrl = config?.proxyUrl;
    
    // Remove any trailing slashes for consistency
    this.rpcUrl = this.rpcUrl.replace(/\/$/, '');
    
    console.log(`ChainStack service initialized with URL: ${this.rpcUrl}`);
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
      
      // Direct RPC call to the node
      const response = await fetch(this.rpcUrl, {
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
      console.log(`RPC response:`, data);
      
      if (data.error) {
        throw new Error(`RPC error: ${data.error.message || JSON.stringify(data.error)}`);
      }
      
      return data.result;
    } catch (error: any) {
      console.error(`ChainStack RPC error (${method}):`, error);
      
      // For getblockhash and getblock methods, try fallbacks to blockchain.info API
      if (method === 'getblockhash' && params.length > 0) {
        return this.fallbackGetBlockHashByHeight(params[0]);
      } else if (method === 'getblock' && params.length > 0) {
        return this.fallbackGetBlockByHash(params[0]);
      }
      
      throw error;
    }
  }
  
  /**
   * Fallback implementation for getblockhash using blockchain.info API
   */
  private async fallbackGetBlockHashByHeight(height: number): Promise<string> {
    try {
      const url = `${this.rpcUrl === DEFAULT_RPC_ENDPOINT ? this.rpcUrl : 'https://blockchain.info'}/block-height/${height}?format=json`;
      console.log(`Using fallback blockchain.info API: ${url}`);
      
      const response = await fetch(url);
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
      const url = `${this.rpcUrl === DEFAULT_RPC_ENDPOINT ? this.rpcUrl : 'https://blockchain.info'}/rawblock/${blockHash}`;
      console.log(`Using fallback blockchain.info API: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
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
      const response = await fetch(url);
      
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
   * Gets transaction details using RPC, falling back to blockchain.info API
   * @param txid Transaction ID
   * @returns Transaction details
   */
  async getTransaction(txid: string): Promise<any> {
    try {
      // Try direct RPC call first
      try {
        const txData = await this.rpcCall('getrawtransaction', [txid, true]);
        return txData;
      } catch (rpcError) {
        console.warn("Failed to get transaction via RPC, falling back to blockchain.info:", rpcError);
      }
      
      // Fallback to blockchain.info API with CORS handling
      const url = `https://blockchain.info/rawtx/${txid}?format=json`;
      const data = await this.fetchData(url);
      
      if (!data) {
        throw new Error(`Transaction not found: ${txid}`);
      }
      
      // Convert blockchain.info format to a format more similar to bitcoind RPC
      const transformedData = {
        txid: data.hash,
        version: data.ver,
        locktime: data.lock_time,
        size: data.size,
        hex: '', // blockchain.info doesn't provide hex directly
        vin: data.inputs.map((input: any) => ({
          txid: input.prev_out?.hash,
          vout: input.prev_out?.n,
          scriptSig: {
            asm: '',
            hex: input.script
          },
          sequence: input.sequence,
          witness: input.witness,
          txinwitness: input.witness ? [input.witness] : undefined
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
      
      return transformedData;
    } catch (error) {
      console.error(`Failed to get transaction details for ${txid}:`, error);
      throw error;
    }
  }

  /**
   * Gets block hash by height using blockchain API
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
        console.warn("Failed to get block hash via RPC, falling back to blockchain.info:", rpcError);
      }
      
      // Fallback to blockchain.info
      const url = `https://blockchain.info/block-height/${height}?format=json`;
      console.log(`Falling back to blockchain.info API: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data?.blocks && data.blocks.length > 0) {
        return data.blocks[0].hash;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to get block hash for height ${height}:`, error);
      return null;
    }
  }

  /**
   * Gets full block data by hash using blockchain API
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
        console.warn("Failed to get block via RPC, falling back to blockchain.info:", rpcError);
      }
      
      // Fallback to blockchain.info
      const url = `https://blockchain.info/rawblock/${blockHash}`;
      console.log(`Falling back to blockchain.info API: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
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

// Create a default instance
export const chainstackService = new ChainStackService();

// Add method to initialize with custom configuration
export const initializeChainStack = (config: ChainStackConfig): ChainStackService => {
  return new ChainStackService(config);
};
