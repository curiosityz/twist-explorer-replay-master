
/**
 * ChainStack API service for blockchain interactions
 */

import { UTXO, TxInput, TxOutput } from '@/lib/walletUtils';
import { toast } from 'sonner';

// Default RPC endpoint
const DEFAULT_RPC_ENDPOINT = 'https://api.blockcypher.com/v1/btc/main';

interface ChainStackConfig {
  rpcUrl: string;
  apiKey?: string;
}

export class ChainStackService {
  private rpcUrl: string;
  private apiKey: string | undefined;
  
  constructor(config?: ChainStackConfig) {
    this.rpcUrl = config?.rpcUrl || DEFAULT_RPC_ENDPOINT;
    this.apiKey = config?.apiKey;
  }
  
  /**
   * Makes an RPC call to the blockchain node
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
    
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`RPC error: ${data.error.message}`);
    }
    
    return data.result;
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
    return await this.rpcCall('getblockcount', []);
  }
  
  /**
   * Gets UTXOs for a specific address
   * @param address Bitcoin address
   * @returns Array of UTXOs
   */
  async getAddressUtxos(address: string): Promise<UTXO[]> {
    // For Bitcoin Core compatible API
    // First try listunspent if available (works on many providers)
    try {
      const result = await this.rpcCall('listunspent', [0, 9999999, [address]]);
      if (result && Array.isArray(result)) {
        return result.map((utxo: any) => ({
          txid: utxo.txid,
          vout: utxo.vout,
          value: utxo.amount * 100000000, // Convert BTC to satoshis
          scriptPubKey: utxo.scriptPubKey,
          address: address,
          confirmations: utxo.confirmations || 0
        }));
      }
    } catch (e) {
      console.log('listunspent not supported, trying scantxoutset');
    }
    
    // Try scantxoutset as fallback (Chainstack specific)
    const result = await this.rpcCall('scantxoutset', ['start', [`addr(${address})`]]);
    
    if (!result || !result.unspents) {
      console.log(`No UTXOs found for address ${address}`);
      return [];
    }
    
    return result.unspents.map((utxo: any) => ({
      txid: utxo.txid,
      vout: utxo.vout,
      value: utxo.amount * 100000000, // Convert BTC to satoshis
      scriptPubKey: utxo.scriptPubKey,
      address: address,
      confirmations: 0 // Not provided by scantxoutset
    }));
  }
  
  /**
   * Gets balance for an address
   * @param address Bitcoin address
   * @returns Balance in BTC
   */
  async getAddressBalance(address: string): Promise<number> {
    const utxos = await this.getAddressUtxos(address);
    const totalSatoshis = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
    return totalSatoshis / 100000000; // Convert satoshis to BTC
  }
  
  /**
   * Broadcasts a signed transaction to the network
   * @param txHex Signed transaction in hex format
   * @returns Transaction ID if successful
   */
  async broadcastTransaction(txHex: string): Promise<string> {
    return await this.rpcCall('sendrawtransaction', [txHex]);
  }
  
  /**
   * Creates a raw transaction
   * @param inputs Transaction inputs (UTXOs to spend)
   * @param outputs Transaction outputs (recipients)
   * @returns Raw transaction hex
   */
  async createRawTransaction(inputs: TxInput[], outputs: TxOutput[]): Promise<string> {
    // Convert outputs to the format expected by Bitcoin Core
    const outputsObject: Record<string, number> = {};
    outputs.forEach(output => {
      // Convert satoshis to BTC for the API
      outputsObject[output.address] = output.value / 100000000;
    });
    
    return await this.rpcCall('createrawtransaction', [inputs, outputsObject]);
  }
  
  /**
   * Gets transaction details
   * @param txid Transaction ID
   * @returns Transaction details
   */
  async getTransaction(txid: string): Promise<any> {
    return await this.rpcCall('getrawtransaction', [txid, true]);
  }
  
  /**
   * Gets current fee estimates
   * @returns Fee estimates in satoshis/vbyte
   */
  async estimateFee(): Promise<{high: number, medium: number, low: number}> {
    // Get fee estimate for 1, 6, and 24 block targets
    const highFee = await this.rpcCall('estimatesmartfee', [1]);
    const mediumFee = await this.rpcCall('estimatesmartfee', [6]);
    const lowFee = await this.rpcCall('estimatesmartfee', [24]);
    
    // Convert BTC/kB to satoshis/vbyte
    return {
      high: (highFee.feerate * 100000000) / 1000,
      medium: (mediumFee.feerate * 100000000) / 1000,
      low: (lowFee.feerate * 100000000) / 1000
    };
  }
}

// Create a default instance
export const chainstackService = new ChainStackService();

// Add method to initialize with custom configuration
export const initializeChainStack = (config: ChainStackConfig): ChainStackService => {
  return new ChainStackService(config);
};
