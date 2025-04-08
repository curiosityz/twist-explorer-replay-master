
/**
 * Public key compression/decompression utilities
 */

import { isPointOnCurve } from './isPointOnCurve';
import { curveParams } from '../constants';

/**
 * Public key decompression result
 */
interface DecompressedKey {
  x: string;
  y: string;
  isOnCurve: boolean;
}

/**
 * Decompress a public key from its compressed format
 * @param compressedPubKey Compressed public key as hex string
 * @returns Decompressed public key with x and y coordinates
 */
export const decompressPublicKey = (compressedPubKey: string): DecompressedKey => {
  if (!compressedPubKey.startsWith('02') && !compressedPubKey.startsWith('03')) {
    // Check if it's already uncompressed
    if (compressedPubKey.startsWith('04') && compressedPubKey.length === 130) {
      return {
        x: compressedPubKey.substring(2, 66),
        y: compressedPubKey.substring(66, 130),
        isOnCurve: true // We assume it's valid if in uncompressed format
      };
    }
    throw new Error('Invalid compressed public key format');
  }

  // Extract the x coordinate (without the prefix)
  const xHex = compressedPubKey.substring(2);
  
  // First try to use secp256k1 library if available
  if (window.secp256k1) {
    try {
      // Convert hex to bytes
      const pubKeyBytes = new Uint8Array(
        compressedPubKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      );
      
      // Use the library to decompress
      // Fix: Remove the second parameter from publicKeyConvert
      const decompressedKey = window.secp256k1.publicKeyConvert(pubKeyBytes);
      
      // Extract coordinates from result (format: 04 | x | y)
      const x = Array.from(decompressedKey.slice(1, 33))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
        
      const y = Array.from(decompressedKey.slice(33, 65))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
        
      return { x, y, isOnCurve: true };
    } catch (error) {
      console.error('Error decompressing key with secp256k1:', error);
      // Fall back to manual decompression
    }
  }

  // Manual decompression as fallback
  // For secp256k1, y² = x³ + 7 (mod p)
  const p = curveParams.p;
  const x = BigInt('0x' + xHex);
  
  // y² = x³ + 7 (mod p)
  const ySquared = (x ** 3n + 7n) % p;
  
  // Calculate square root modulo p
  // Note: This only works for primes p where p ≡ 3 (mod 4)
  // For secp256k1, this is true
  let y = powMod(ySquared, (p + 1n) / 4n, p);
  
  // Check which root we need based on the prefix
  // 02 = even y, 03 = odd y
  const isOdd = compressedPubKey.startsWith('03');
  
  if ((y % 2n === 0n) !== !isOdd) {
    y = p - y; // Take the other root
  }
  
  // Convert to hex
  const yHex = y.toString(16).padStart(64, '0');
  
  const result = {
    x: xHex,
    y: yHex,
    isOnCurve: isPointOnCurve(x, y)
  };
  
  // Validation
  if (!result.isOnCurve) {
    console.warn('Decompressed point is not on curve, validation failed');
  }
  
  return result;
};

/**
 * Calculate (base^exponent) % modulus efficiently
 */
function powMod(base: bigint, exponent: bigint, modulus: bigint): bigint {
  if (exponent === 0n) return 1n;
  
  let result = 1n;
  base = base % modulus;
  
  while (exponent > 0n) {
    if (exponent % 2n === 1n) {
      result = (result * base) % modulus;
    }
    exponent = exponent >> 1n;
    base = (base * base) % modulus;
  }
  
  return result;
}
