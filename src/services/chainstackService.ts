
/**
 * ChainStack API service for blockchain interactions
 */

import { UTXO, TxInput, TxOutput } from '@/lib/walletUtils';
import { toast } from 'sonner';

// Default RPC endpoint for Bitcoin (updated to use a CORS-friendly endpoint)
const DEFAULT_RPC_ENDPOINT = 'https://blockchain.info/rawblock/';

interface ChainStackConfig {
  rpcUrl: string;
  apiKey?: string;
  proxyUrl?: string;
}

export class ChainStackService {
  private rpcUrl: string;
  private apiKey: string | undefined;
  private proxyUrl: string | undefined;
  
  constructor(config?: ChainStackConfig) {
    this.rpcUrl = config?.rpcUrl || DEFAULT_RPC_ENDPOINT;
    this.apiKey = config?.apiKey;
    this.proxyUrl = config?.proxyUrl;
  }
  
  /**
   * Makes an RPC call to the blockchain node, handling CORS issues
   * @param method RPC method name
   * @param params Parameters for the RPC call
   * @returns Response from the node
   */
  private async rpcCall(method: string, params: any[] = []): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      headers['x-api-key'] = this.apiKey;
    }
    
    // If we have a proxy URL, use it instead of direct API call
    const url = this.proxyUrl ? 
      `${this.proxyUrl}?method=${method}&params=${encodeURIComponent(JSON.stringify(params))}` : 
      this.rpcUrl;
    
    try {
      console.log(`Making RPC call to: ${url}`);
      const response = await fetch(url, {
        method: this.proxyUrl ? 'GET' : 'POST',
        headers,
        body: this.proxyUrl ? undefined : JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method,
          params
        }),
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(`RPC error: ${data.error.message || JSON.stringify(data.error)}`);
      }
      
      return this.proxyUrl ? data : data.result;
    } catch (error) {
      console.error(`ChainStack RPC error (${method}):`, error);
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
   * Gets the current block height
   * @returns Current block height
   */
  async getBlockHeight(): Promise<number> {
    try {
      const result = await fetch('https://blockchain.info/q/getblockcount');
      const text = await result.text();
      return parseInt(text, 10);
    } catch (error) {
      console.error("Failed to get block height:", error);
      throw error;
    }
  }
  
  /**
   * Gets UTXOs for a specific address using blockchain.info API
   * @param address Bitcoin address
   * @returns Array of UTXOs
   */
  async getAddressUtxos(address: string): Promise<UTXO[]> {
    try {
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
   * Gets balance for an address
   * @param address Bitcoin address
   * @returns Balance in BTC
   */
  async getAddressBalance(address: string): Promise<number> {
    try {
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
   * Broadcasts a signed transaction to the network
   * @param txHex Signed transaction in hex format
   * @returns Transaction ID if successful
   */
  async broadcastTransaction(txHex: string): Promise<string> {
    try {
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
   * Creates a raw transaction
   * @param inputs Transaction inputs (UTXOs to spend)
   * @param outputs Transaction outputs (recipients)
   * @returns Raw transaction hex
   */
  async createRawTransaction(inputs: TxInput[], outputs: TxOutput[]): Promise<string> {
    // This operation requires a real node - we'll throw an informative error
    throw new Error("Creating raw transactions requires a full Bitcoin node. Please configure a valid node endpoint.");
  }
  
  /**
   * Gets transaction details using blockchain.info API
   * @param txid Transaction ID
   * @returns Transaction details
   */
  async getTransaction(txid: string): Promise<any> {
    try {
      // Use blockchain.info API instead of direct RPC
      const response = await fetch(`https://blockchain.info/rawtx/${txid}?format=json`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
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
   * Gets current fee estimates
   * @returns Fee estimates in satoshis/vbyte
   */
  async estimateFee(): Promise<{high: number, medium: number, low: number}> {
    try {
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
