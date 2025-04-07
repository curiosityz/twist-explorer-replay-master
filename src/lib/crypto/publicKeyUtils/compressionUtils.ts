
/**
 * Utilities for public key compression and decompression
 */

import { isPointOnSecp256k1Curve } from './isPointOnCurve';

/**
 * Decompress a compressed public key to get its X and Y coordinates
 * @param compressedPubKey Compressed public key as hex string
 * @returns Object containing X and Y coordinates and validity flag
 */
export const decompressPublicKey = (compressedPubKey: string): { x: string, y: string, isOnCurve: boolean } => {
  try {
    // Clean input
    const cleanPubKey = compressedPubKey.startsWith('0x') ? compressedPubKey.slice(2) : compressedPubKey;
    
    // Validate input format - must be 33 bytes (66 hex chars) for compressed key
    // with either 02 or 03 prefix
    if (cleanPubKey.length !== 66 || (cleanPubKey[0] !== '0' && cleanPubKey[1] !== '2' && 
                                      cleanPubKey[0] !== '0' && cleanPubKey[1] !== '3')) {
      // Check if it's an uncompressed key (starts with 04)
      if (cleanPubKey.length === 130 && cleanPubKey[0] === '0' && cleanPubKey[1] === '4') {
        const x = cleanPubKey.slice(2, 66);
        const y = cleanPubKey.slice(66, 130);
        return { 
          x, 
          y,
          isOnCurve: isPointOnSecp256k1Curve(x, y)
        };
      }
      
      throw new Error("Invalid compressed public key format");
    }
    
    // Extract prefix and x coordinate
    const prefix = cleanPubKey.slice(0, 2);
    const isEven = prefix === '02';
    const xHex = cleanPubKey.slice(2);
    
    // Try using native secp256k1 library first
    if (window.secp256k1) {
      try {
        // Convert hex to bytes format for secp256k1 library
        const compressedKeyBytes = new Uint8Array(33);
        compressedKeyBytes[0] = isEven ? 0x02 : 0x03;
        
        for (let i = 0; i < 32; i++) {
          compressedKeyBytes[i + 1] = parseInt(xHex.slice(i * 2, i * 2 + 2), 16);
        }
        
        // Use secp256k1 library to decompress
        // Fixed: removed the second parameter
        const uncompressedPoint = window.secp256k1.publicKeyConvert(compressedKeyBytes);
        
        // Extract x and y coordinates
        const resultX = Array.from(uncompressedPoint.slice(1, 33))
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');
          
        const resultY = Array.from(uncompressedPoint.slice(33, 65))
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');
        
        return {
          x: resultX,
          y: resultY,
          isOnCurve: true  // If secp256k1 decompresses it, it's on the curve
        };
      } catch (error) {
        console.error("Error using secp256k1 for decompression:", error);
        // Fall back to manual calculation
      }
    }
    
    // Fallback: Manual calculation using the secp256k1 curve equation
    // y² = x³ + 7 (mod p)
    
    // secp256k1 parameters
    const p = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn;
    const a = 0n;  // Coefficient a in curve equation
    const b = 7n;  // Coefficient b in curve equation
    
    // Parse x coordinate as BigInt
    const x = BigInt(`0x${xHex}`);
    
    // Calculate y² = x³ + ax + b
    const xCubed = (x * x * x) % p;
    const ax = (a * x) % p;
    const ySquared = (xCubed + ax + b) % p;
    
    // Calculate square root modulo p
    // For p ≡ 3 (mod 4), we can use y = (y²)^((p+1)/4)
    // This works for secp256k1's prime
    const yAbs = modularExponentiation(ySquared, (p + 1n) / 4n, p);
    
    // Determine correct y value based on parity
    let y;
    const yIsEven = yAbs % 2n === 0n;
    
    if (isEven === yIsEven) {
      y = yAbs;
    } else {
      y = p - yAbs;
    }
    
    // Convert back to hex
    const resultX = x.toString(16).padStart(64, '0');
    const resultY = y.toString(16).padStart(64, '0');
    
    return {
      x: resultX,
      y: resultY,
      isOnCurve: isPointOnSecp256k1Curve(resultX, resultY)
    };
  } catch (error: any) {
    console.error("Error decompressing public key:", error);
    // Return empty coordinates with flag indicating failure
    return {
      x: "",
      y: "",
      isOnCurve: false
    };
  }
};

/**
 * Calculate modular exponentiation efficiently (base^exponent mod modulus)
 * @param base Base value
 * @param exponent Exponent value
 * @param modulus Modulus value
 * @returns Result of modular exponentiation
 */
const modularExponentiation = (base: bigint, exponent: bigint, modulus: bigint): bigint => {
  if (modulus === 1n) return 0n;
  
  let result = 1n;
  base = base % modulus;
  
  while (exponent > 0n) {
    if (exponent % 2n === 1n) {
      result = (result * base) % modulus;
    }
    exponent = exponent / 2n;
    base = (base * base) % modulus;
  }
  
  return result;
};
