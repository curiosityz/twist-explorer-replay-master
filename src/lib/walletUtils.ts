
/**
 * Wallet utility functions for Bitcoin and related transactions
 */
import { hexToBigInt, bigIntToHex, normalizePrivateKey } from './cryptoUtils';

// Interface for UTXO structure
export interface UTXO {
  txid: string;
  vout: number;
  value: number;  // In satoshis
  scriptPubKey?: string;
  address?: string;
  confirmations?: number;
}

// Interface for transaction inputs
export interface TxInput {
  txid: string;
  vout: number;
  scriptSig?: string;
  sequence?: number;
  witness?: string[];
}

// Interface for transaction outputs
export interface TxOutput {
  address: string;
  value: number;  // In satoshis
}

// Interface for wallet key information
export interface WalletKey {
  privateKey: string;
  publicKey: {
    x: string;
    y: string;
  };
  address: string;
  network: 'mainnet' | 'testnet';
  balance?: number;
  verified: boolean;
}

/**
 * Converts a BTC value to satoshis
 * @param btc Value in BTC
 * @returns Value in satoshis
 */
export const btcToSatoshis = (btc: number): number => {
  return Math.floor(btc * 100000000);
};

/**
 * Converts satoshis to BTC value
 * @param satoshis Value in satoshis
 * @returns Value in BTC
 */
export const satoshisToBtc = (satoshis: number): number => {
  return satoshis / 100000000;
};

/**
 * Format BTC value for display (8 decimal places)
 * @param value BTC value as number
 * @returns Formatted string
 */
export const formatBtcValue = (value: number): string => {
  return value.toFixed(8);
};

/**
 * Formats USD value based on BTC amount and current exchange rate
 * @param btcValue BTC value
 * @param exchangeRate Exchange rate (USD per BTC)
 * @returns Formatted USD string
 */
export const formatUsdValue = (btcValue: number, exchangeRate: number = 60000): string => {
  const usdValue = btcValue * exchangeRate;
  return new Intl.NumberFormatter('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(usdValue);
};

/**
 * Generates a transaction signature
 * @param privateKey Private key in hex format
 * @param txHex Transaction hex to sign
 * @param inputIndex Index of the input to sign
 * @param sighashType Signature hash type (default: SIGHASH_ALL)
 * @returns Signature in hex format
 */
export const signTransaction = async (
  privateKey: string,
  txHex: string,
  inputIndex: number,
  sighashType: number = 0x01
): Promise<string | null> => {
  try {
    // This is a placeholder - in a real implementation, we would use
    // a library like bitcoinjs-lib to sign the transaction
    console.log(`Signing transaction with key ${privateKey.substring(0, 10)}...`);
    console.log(`Transaction: ${txHex.substring(0, 20)}...`);
    
    // Mock signing result for demo purposes
    return "304402201af8c5e5f7c0a80ea4a412a95f4f2c8a3949277cfcbb7ffc2e0c51b2cf945fdb02201d563ea57c9160fbbf8e7f4ef343732a5c49f0f3d78a978d463438b1ba707e3a";
  } catch (error) {
    console.error("Error signing transaction:", error);
    return null;
  }
};

/**
 * Derives a Bitcoin address from a private key
 * @param privateKey Private key in hex format
 * @param network 'mainnet' or 'testnet'
 * @returns Bitcoin address
 */
export const deriveAddress = (
  privateKey: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): string => {
  // In a real implementation, we would use bitcoinjs-lib to derive the address
  // This is a simplified mock implementation for demo purposes
  const normalizedKey = normalizePrivateKey(privateKey);
  
  // Mock addresses based on key prefix for demo
  const prefix = normalizedKey.substring(2, 10);
  const mockAddressPrefix = network === 'mainnet' ? '1' : 'm';
  const mockAddressSuffix = Buffer.from(prefix).toString('base64').replace(/[+/=]/g, '');
  
  return `${mockAddressPrefix}${mockAddressSuffix}`;
};

/**
 * Validates a Bitcoin address format
 * @param address Bitcoin address to validate
 * @returns Boolean indicating if address is valid
 */
export const validateAddress = (address: string): boolean => {
  // In a real implementation, we would use proper validation
  // This is a simplified check for demo purposes
  if (!address || address.length < 26 || address.length > 35) {
    return false;
  }
  
  // Simple prefix check
  return /^[13mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
};
