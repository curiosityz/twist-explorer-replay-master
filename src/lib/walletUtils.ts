
/**
 * Wallet utility functions for Bitcoin and related transactions
 */
import { hexToBigInt, bigIntToHex, normalizePrivateKey, isPointOnCurve } from './cryptoUtils';

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

// Bitcoin address types
export type BitcoinAddressType = 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2wsh' | 'p2tr' | 'unknown';

// Transaction signature hash types
export enum SighashType {
  ALL = 0x01,
  NONE = 0x02,
  SINGLE = 0x03,
  ANYONECANPAY = 0x80
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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(usdValue);
};

/**
 * Hash function for SHA-256
 * @param data Data to hash (hex string or bytes)
 * @returns Hex string of hash
 */
export const sha256 = async (data: string | Uint8Array): Promise<string> => {
  try {
    let dataBuffer: ArrayBuffer;
    
    if (typeof data === 'string') {
      // Convert hex string to bytes
      if (data.startsWith('0x')) data = data.slice(2);
      dataBuffer = new Uint8Array(data.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []).buffer;
    } else {
      dataBuffer = data.buffer;
    }
    
    // Use the Web Crypto API for hashing
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return '0x' + hashHex;
  } catch (error) {
    console.error('SHA-256 hashing error:', error);
    throw new Error('Failed to compute SHA-256 hash');
  }
};

/**
 * Double SHA-256 hash (used extensively in Bitcoin)
 * @param data Data to hash (hex string or bytes)
 * @returns Hex string of double hash
 */
export const doubleSha256 = async (data: string | Uint8Array): Promise<string> => {
  const firstHash = await sha256(data);
  return sha256(firstHash);
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
  sighashType: SighashType = SighashType.ALL
): Promise<string | null> => {
  try {
    // This is a placeholder - in a real implementation, we would use
    // a library like bitcoinjs-lib to sign the transaction
    console.log(`Signing transaction with key ${privateKey.substring(0, 10)}...`);
    console.log(`Transaction: ${txHex.substring(0, 20)}...`);
    
    // To properly implement this function, we would:
    // 1. Decode the transaction from hex
    // 2. Create a signature hash based on the transaction data and input being signed
    // 3. Sign the hash with the private key
    // 4. Return the signature in DER format
    
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
  
  // For a proper implementation, we would:
  // 1. Convert private key to a key pair
  // 2. Get the public key from that key pair
  // 3. Hash the public key: RIPEMD160(SHA256(publicKey))
  // 4. Add version byte (0x00 for mainnet, 0x6f for testnet)
  // 5. Calculate checksum: first 4 bytes of SHA256(SHA256(versionByte + hash))
  // 6. Concatenate: versionByte + hash + checksum
  // 7. Convert to base58
  
  // Mock addresses based on key prefix for demo
  const prefix = normalizedKey.substring(2, 10);
  let mockAddress: string;
  
  if (network === 'mainnet') {
    // Bitcoin mainnet addresses start with 1 (P2PKH)
    mockAddress = `1${Buffer.from(prefix).toString('base64').replace(/[+/=]/g, '')}`;
  } else {
    // Bitcoin testnet addresses start with m or n (P2PKH)
    mockAddress = `m${Buffer.from(prefix).toString('base64').replace(/[+/=]/g, '')}`;
  }
  
  // Ensure address is valid length for Bitcoin (26-35 chars)
  return mockAddress.substring(0, Math.min(34, mockAddress.length));
};

/**
 * Validates a Bitcoin address format
 * @param address Bitcoin address to validate
 * @returns Boolean indicating if address is valid
 */
export const validateAddress = (address: string): boolean => {
  if (!address || address.length < 26 || address.length > 35) {
    return false;
  }
  
  // Basic format validation
  if (address.startsWith('1')) {
    // P2PKH - Legacy address
    return /^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
  } else if (address.startsWith('3')) {
    // P2SH - Script hash address
    return /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
  } else if (address.startsWith('bc1')) {
    // Bech32 - SegWit address
    return /^bc1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{25,90}$/.test(address);
  } else if (address.startsWith('m') || address.startsWith('n') || address.startsWith('2')) {
    // Testnet addresses
    return /^[mn2][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
  } else if (address.startsWith('tb1')) {
    // Testnet SegWit addresses
    return /^tb1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{25,90}$/.test(address);
  }
  
  return false;
};

/**
 * Determines the type of a Bitcoin address
 * @param address Bitcoin address
 * @returns The address type
 */
export const getAddressType = (address: string): BitcoinAddressType => {
  if (!validateAddress(address)) return 'unknown';
  
  if (address.startsWith('1')) {
    return 'p2pkh'; // Pay to Public Key Hash (Legacy)
  } else if (address.startsWith('3')) {
    return 'p2sh'; // Pay to Script Hash (could wrap P2WPKH or P2WSH)
  } else if (address.startsWith('bc1q')) {
    return 'p2wpkh'; // Pay to Witness Public Key Hash (SegWit v0)
  } else if (address.startsWith('bc1p')) {
    return 'p2tr'; // Pay to Taproot (SegWit v1)
  } else if (address.startsWith('bc1')) {
    // If not bc1q or bc1p, but starts with bc1, probably P2WSH
    return 'p2wsh'; // Pay to Witness Script Hash
  }
  
  return 'unknown';
};

/**
 * Converts a public key to a hex string
 * @param pubKey Public key object with x and y coordinates
 * @param compressed Whether to output compressed format
 * @returns Hex string representation of the public key
 */
export const publicKeyToHex = (
  pubKey: { x: string; y: string },
  compressed = true
): string => {
  // Remove '0x' prefix if present
  const x = pubKey.x.startsWith('0x') ? pubKey.x.slice(2) : pubKey.x;
  const y = pubKey.y.startsWith('0x') ? pubKey.y.slice(2) : pubKey.y;
  
  // Ensure coordinates are properly padded to 64 characters (32 bytes)
  const paddedX = x.padStart(64, '0');
  
  if (compressed) {
    // For compressed format, we use 0x02 for even y, 0x03 for odd y
    // We need to check if the last byte of y is even or odd
    const yValue = BigInt(`0x${y}`);
    const prefix = yValue % 2n === 0n ? '02' : '03';
    return `${prefix}${paddedX}`;
  } else {
    // Uncompressed format: 0x04 + x + y
    const paddedY = y.padStart(64, '0');
    return `04${paddedX}${paddedY}`;
  }
};

/**
 * Extracts the public key from a script signature
 * @param scriptSig Script signature from a transaction input
 * @returns Extracted public key or null if not found
 */
export const extractPublicKeyFromScriptSig = (scriptSig: string): string | null => {
  try {
    // This is a simplified implementation that assumes the script ends with the public key
    // Real implementation would need to parse the script properly
    
    // Look for common patterns where public key is pushed onto the stack
    // These are typical patterns in P2PKH scripts
    const pubKeyMatches = scriptSig.match(/([0-2][0-9a-fA-F]{64,65}|04[0-9a-fA-F]{128})$/);
    if (pubKeyMatches && pubKeyMatches[1]) {
      return pubKeyMatches[1];
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting public key:", error);
    return null;
  }
};

/**
 * Converts a private key from hex format to WIF (Wallet Import Format)
 * @param privateKeyHex Private key in hex format (with or without 0x prefix)
 * @param compressed Whether to generate WIF for compressed public keys
 * @param testnet Whether to use testnet prefix
 * @returns WIF encoded private key
 */
export const hexToWIF = (
  privateKeyHex: string,
  compressed = true,
  testnet = false
): string => {
  // This is a placeholder - in a real implementation, we would:
  // 1. Remove 0x prefix if present
  // 2. Add version byte (0x80 for mainnet, 0xef for testnet)
  // 3. Append 0x01 if compressed
  // 4. Calculate double SHA256 checksum
  // 5. Append checksum
  // 6. Base58 encode
  
  // For now, we'll just return a mock WIF based on the input
  const normalizedKey = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex;
  const prefix = testnet ? 'c' : 'K';
  const mockWIF = `${prefix}${normalizedKey.substring(0, 8)}...${normalizedKey.substring(normalizedKey.length - 4)}`;
  
  // A real implementation would use a library like bitcoinjs-lib:
  // import * as bitcoin from 'bitcoinjs-lib';
  // const keyPair = bitcoin.ECPair.fromPrivateKey(Buffer.from(normalizedKey, 'hex'), { compressed });
  // return keyPair.toWIF();
  
  return mockWIF;
};

/**
 * Parses a Bitcoin script to extract meaningful data
 * @param script Hex script to parse
 * @returns Parsed script components and type
 */
export const parseScript = (script: string): {
  type: string;
  addresses?: string[];
  publicKeys?: string[];
  requiredSignatures?: number;
} => {
  // This is a placeholder for script parsing logic
  // In a real implementation, this would parse the script opcodes
  // and identify the script type and relevant data
  
  // For now, we'll return a mock result based on the script length
  if (script.startsWith('76a914') && script.endsWith('88ac')) {
    // Looks like a P2PKH script
    return {
      type: 'p2pkh',
      addresses: ['1' + script.substring(6, 46)],
      requiredSignatures: 1
    };
  } else if (script.startsWith('a914') && script.endsWith('87')) {
    // Looks like a P2SH script
    return {
      type: 'p2sh',
      addresses: ['3' + script.substring(4, 44)],
      requiredSignatures: 1
    };
  } else if (script.startsWith('0014')) {
    // Looks like a P2WPKH script
    return {
      type: 'p2wpkh',
      addresses: ['bc1' + script.substring(4, 44)],
      requiredSignatures: 1
    };
  } else if (script.length > 70 && script.includes('21')) {
    // Might be a multisig or complex script
    return {
      type: 'complex',
      requiredSignatures: 2
    };
  }
  
  return {
    type: 'unknown'
  };
};

/**
 * Checks if a private key is valid by range checking against curve order
 * @param privateKeyHex Private key in hex format
 * @returns Boolean indicating validity
 */
export const isValidPrivateKey = (privateKeyHex: string): boolean => {
  try {
    const privateKey = hexToBigInt(privateKeyHex);
    
    // Valid range: 0 < privateKey < curve order (n)
    const curveOrder = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
    return privateKey > 0n && privateKey < curveOrder;
  } catch (error) {
    console.error("Error validating private key:", error);
    return false;
  }
};
