
/**
 * Utilities for compressing and decompressing public keys
 */

import { createCompressedPublicKey } from './validatePublicKey';

/**
 * Decompress a compressed public key to get x,y coordinates
 * @param compressedPubKeyHex Compressed public key (hex string)
 * @returns Object with x and y coordinates and isOnCurve flag
 */
export const decompressPublicKey = (
  compressedPubKeyHex: string
): { x: string; y: string; isOnCurve: boolean } => {
  try {
    if (!compressedPubKeyHex || typeof compressedPubKeyHex !== 'string') {
      throw new Error("Invalid compressed public key input");
    }
    
    if (compressedPubKeyHex.length !== 66) {
      throw new Error(`Invalid compressed public key length: ${compressedPubKeyHex.length}, expected 66`);
    }
    
    // Check if Bitcoin libraries are loaded
    if (!window.secp256k1) {
      throw new Error("secp256k1 library not loaded");
    }
    
    const prefix = compressedPubKeyHex.slice(0, 2);
    const xHex = compressedPubKeyHex.slice(2);
    
    if (prefix !== "02" && prefix !== "03") {
      throw new Error(`Invalid public key prefix: ${prefix}. Must be 02 or 03`);
    }
    
    // Convert hex to Buffer/Uint8Array (as expected by secp256k1)
    const compressedPubKey = new Uint8Array(
      compressedPubKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    // Use secp256k1 library to decompress the key
    try {
      // Fix: Call publicKeyConvert without a second argument
      const decompressedKey = window.secp256k1.publicKeyConvert(compressedPubKey);
      
      if (!decompressedKey || decompressedKey.length !== 65) {
        throw new Error(`Invalid decompressed key length: ${decompressedKey?.length}`);
      }
      
      // Extract x and y from decompressed key (format: 04|x|y)
      const xBytes = decompressedKey.slice(1, 33);
      const yBytes = decompressedKey.slice(33, 65);
      
      // Convert to hex strings
      const x = Array.from(xBytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
        
      const y = Array.from(yBytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
        
      return {
        x,
        y,
        isOnCurve: true // If secp256k1 decompression succeeded, it's on the curve
      };
    } catch (error) {
      console.error("Public key decompression failed:", error);
      
      // If decompression failed, the key is likely not on the curve
      throw new Error(`Failed to decompress public key: ${error}`);
    }
  } catch (error: any) {
    console.error("Error decompressing public key:", error);
    throw new Error(`Failed to decompress public key: ${error.message}`);
  }
};
