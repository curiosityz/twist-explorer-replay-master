
/**
 * Private key utilities for Bitcoin cryptography
 */

import { hexToBigInt, bigIntToHex } from './mathUtils';
import { curveParams } from './constants';

/**
 * Normalize a private key to a standard format
 * @param privateKeyInput Private key in various formats (hex, WIF, etc.)
 * @returns Normalized private key as hex string
 */
export const normalizePrivateKey = (privateKeyInput: string): string => {
  try {
    // Remove whitespace and common prefixes
    let privateKey = privateKeyInput.trim();
    
    // Handle common prefixes
    if (privateKey.toLowerCase().startsWith('0x')) {
      privateKey = privateKey.substring(2);
    }
    
    // Check if it's a WIF format (Wallet Import Format)
    if (privateKey.length >= 50 && (privateKey.startsWith('5') || 
                                   privateKey.startsWith('K') || 
                                   privateKey.startsWith('L'))) {
      return wifToPrivateKey(privateKey);
    }
    
    // Validate as hex
    if (!/^[0-9a-fA-F]+$/.test(privateKey)) {
      throw new Error("Private key must be in hexadecimal format");
    }
    
    // Ensure correct length (32 bytes = 64 hex chars)
    if (privateKey.length < 64) {
      privateKey = privateKey.padStart(64, '0');
    } else if (privateKey.length > 64) {
      privateKey = privateKey.substring(privateKey.length - 64);
      console.warn("Private key was truncated to 32 bytes");
    }
    
    // Validate key is in valid range for secp256k1
    const keyValue = hexToBigInt(privateKey);
    if (keyValue <= 0n || keyValue >= curveParams.n) {
      throw new Error("Private key out of valid range");
    }
    
    return privateKey;
  } catch (error: any) {
    console.error("Error normalizing private key:", error);
    throw new Error(`Invalid private key: ${error.message}`);
  }
};

/**
 * Verify a private key against a public key
 * @param privateKeyHex Private key in hex format
 * @param publicKeyXHex Public key X coordinate in hex format
 * @param publicKeyYHex Public key Y coordinate in hex format
 * @returns Boolean indicating if the private key matches the public key
 */
export const verifyPrivateKey = (
  privateKeyHex: string, 
  publicKeyXHex: string, 
  publicKeyYHex: string
): boolean => {
  try {
    // Check if libraries are loaded
    if (!window.secp256k1) {
      throw new Error("secp256k1 library not loaded");
    }
    
    // Normalize inputs
    const privKey = privateKeyHex.startsWith('0x') 
      ? privateKeyHex.substring(2) 
      : privateKeyHex;
      
    const pubX = publicKeyXHex.startsWith('0x') 
      ? publicKeyXHex.substring(2) 
      : publicKeyXHex;
      
    const pubY = publicKeyYHex.startsWith('0x') 
      ? publicKeyYHex.substring(2) 
      : publicKeyYHex;
      
    // Convert private key to bytes
    const privKeyBytes = new Uint8Array(
      privKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    // Derive public key from private key using secp256k1 library
    const derivedPubKey = window.secp256k1.publicKeyCreate(privKeyBytes);
    
    // Convert derived public key to uncompressed format (if needed)
    // Fixed: Remove the second parameter from publicKeyConvert
    const uncompressedDerivedPubKey = window.secp256k1.publicKeyConvert(derivedPubKey);
    
    // Extract x and y coordinates from the derived public key
    const derivedX = Array.from(uncompressedDerivedPubKey.slice(1, 33))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
      
    const derivedY = Array.from(uncompressedDerivedPubKey.slice(33, 65))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    
    // Compare the derived public key coordinates with the provided ones
    const xMatches = derivedX.toLowerCase() === pubX.toLowerCase();
    const yMatches = derivedY.toLowerCase() === pubY.toLowerCase();
    
    return xMatches && yMatches;
  } catch (error: any) {
    console.error("Error verifying private key:", error);
    return false;
  }
};

/**
 * Convert WIF format to private key hex
 * @param wif WIF (Wallet Import Format) private key
 * @returns Private key as hex string
 */
export const wifToPrivateKey = (wif: string): string => {
  try {
    // Check if bs58 library is loaded
    if (!window.bs58) {
      throw new Error("bs58 library not loaded");
    }
    
    // Decode the Base58Check encoding
    const decoded = window.bs58.decode(wif);
    
    // Verify checksum if possible (if SHA256 is available)
    if (window.Bitcoin && window.Bitcoin.crypto) {
      const payload = decoded.slice(0, -4);
      const checksum = decoded.slice(-4);
      
      // Double SHA256 hash for checksum verification
      const sha256 = window.Bitcoin.crypto.sha256;
      // Fix: Handle SHA256 function properly
      const hash1 = sha256(payload);
      const calculatedChecksum = sha256(hash1).slice(0, 4);
      
      // Check if checksums match
      const checksumMatches = calculatedChecksum.every((b: number, i: number) => b === checksum[i]);
      if (!checksumMatches) {
        throw new Error("Invalid WIF checksum");
      }
    }
    
    // Check version byte and extract private key
    // Version byte is usually:
    // - 0x80 for mainnet
    // - 0xef for testnet
    const versionByte = decoded[0];
    
    let privateKeyBytes;
    // Check for compressed key format (has extra 0x01 byte at the end)
    if (decoded.length === 34) {
      const compressionByte = decoded[decoded.length - 5];
      if (compressionByte !== 0x01) {
        throw new Error("Invalid compression byte in WIF");
      }
      privateKeyBytes = decoded.slice(1, -5);
    } else {
      // Uncompressed format
      privateKeyBytes = decoded.slice(1, -4);
    }
    
    // Ensure we have the right key length (32 bytes)
    if (privateKeyBytes.length !== 32) {
      throw new Error(`Invalid private key length: ${privateKeyBytes.length} bytes`);
    }
    
    // Convert to hex
    const privateKeyHex = Array.from(privateKeyBytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
      
    return privateKeyHex;
  } catch (error: any) {
    console.error("Error converting WIF to private key:", error);
    throw new Error(`Failed to convert WIF to private key: ${error.message}`);
  }
};
