/**
 * Elliptic curve operations for secp256k1
 */

import { curveParams, twistParams } from './constants';
import { modularInverse, hexToBigInt } from './mathUtils';
import { checkBitcoinLibsLoaded } from './bitcoinLibsCheck';

/**
 * Check if a point is on the secp256k1 curve
 * @param x X coordinate (hex or bigint)
 * @param y Y coordinate (hex or bigint)
 * @returns Boolean indicating if point is on curve
 */
export const isPointOnCurve = (x: string | bigint, y: string | bigint): boolean => {
  const libCheck = checkBitcoinLibsLoaded();
  if (!libCheck.loaded) {
    throw new Error(`Bitcoin libraries not loaded: Missing ${libCheck.missing.join(', ')}`);
  }

  const xBigInt = typeof x === 'string' ? hexToBigInt(x) : x;
  const yBigInt = typeof y === 'string' ? hexToBigInt(y) : y;
  
  // Ensure x and y are within the field range
  if (xBigInt < 0n || xBigInt >= curveParams.p || yBigInt < 0n || yBigInt >= curveParams.p) {
    return false;
  }
  
  // Check if point satisfies curve equation: y² = x³ + 7 (mod p)
  const leftSide = (yBigInt * yBigInt) % curveParams.p;
  const rightSide = (((xBigInt * xBigInt) % curveParams.p) * xBigInt + curveParams.b) % curveParams.p;
  
  return leftSide === rightSide;
};

/**
 * Check if a point is on the twist of the secp256k1 curve
 * @param x X coordinate (hex or bigint)
 * @param y Y coordinate (hex or bigint) 
 * @returns Boolean indicating if point is on twist curve
 */
export const isPointOnTwistCurve = (x: string | bigint, y: string | bigint): boolean => {
  const xBigInt = typeof x === 'string' ? hexToBigInt(x) : x;
  const yBigInt = typeof y === 'string' ? hexToBigInt(y) : y;
  
  // Ensure x and y are within the field range
  if (xBigInt < 0n || xBigInt >= twistParams.p || yBigInt < 0n || yBigInt >= twistParams.p) {
    return false;
  }
  
  // Check if point satisfies twist curve equation: y² = x³ + twist_b (mod p)
  const leftSide = (yBigInt * yBigInt) % twistParams.p;
  const rightSide = (((xBigInt * xBigInt) % twistParams.p) * xBigInt + twistParams.b) % twistParams.p;
  
  return leftSide === rightSide;
};

/**
 * Point addition on secp256k1 curve
 * @param p1 First point [x, y]
 * @param p2 Second point [x, y]
 * @returns Resulting point [x, y] or null for point at infinity
 */
export const pointAdd = (
  p1: [bigint, bigint], 
  p2: [bigint, bigint]
): [bigint, bigint] | null => {
  try {
    // Use secp256k1 library if available for most accurate results
    if (window && window.secp256k1) {
      try {
        // Convert points to compressed format
        const p1Compressed = pointToCompressedHex(p1);
        const p2Compressed = pointToCompressedHex(p2);
        
        // Convert hex to byte arrays
        const p1Bytes = hexStringToByteArray(p1Compressed);
        const p2Bytes = hexStringToByteArray(p2Compressed);
        
        // Add points using the secp256k1 library
        const result = window.secp256k1.publicKeyCombine([p1Bytes, p2Bytes]);
        
        // Convert result back to point coordinates
        return decompressPoint(result);
      } catch (err) {
        console.error("Error using secp256k1 for point addition:", err);
        // Fall back to manual implementation
      }
    }
    
    // Manual implementation if library is not available
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    
    // Handle point at infinity cases
    if (x1 === 0n && y1 === 0n) return [x2, y2];
    if (x2 === 0n && y2 === 0n) return [x1, y1];
    
    // Point doubling
    if (x1 === x2 && y1 === y2) {
      // If y is 0, return point at infinity
      if (y1 === 0n) return null;
      
      // λ = (3x₁² + a) / 2y₁ mod p for point doubling
      const numerator = (3n * x1 * x1 + curveParams.a) % curveParams.p;
      const denominator = (2n * y1) % curveParams.p;
      const denomInverse = modularInverse(denominator, curveParams.p);
      
      if (denomInverse === null) return null;
      
      const lambda = (numerator * denomInverse) % curveParams.p;
      
      // Calculate x3 = λ² - 2x₁ mod p
      const x3 = (lambda * lambda - 2n * x1) % curveParams.p;
      // Calculate y3 = λ(x₁ - x3) - y₁ mod p
      const y3 = (lambda * (x1 - x3) - y1) % curveParams.p;
      
      return [(x3 + curveParams.p) % curveParams.p, (y3 + curveParams.p) % curveParams.p];
    }
    
    // Different points
    if (x1 === x2 && y1 !== y2) {
      // Return point at infinity (vertical line)
      return null;
    }
    
    // λ = (y₂ - y₁) / (x₂ - x₁) mod p for different points
    const numerator = (y2 - y1) % curveParams.p;
    const denominator = (x2 - x1) % curveParams.p;
    const denomInverse = modularInverse(denominator, curveParams.p);
    
    if (denomInverse === null) return null;
    
    const lambda = (numerator * denomInverse) % curveParams.p;
    
    // Calculate x3 = λ² - x₁ - x₂ mod p
    const x3 = (lambda * lambda - x1 - x2) % curveParams.p;
    // Calculate y3 = λ(x₁ - x3) - y₁ mod p
    const y3 = (lambda * (x1 - x3) - y1) % curveParams.p;
    
    return [(x3 + curveParams.p) % curveParams.p, (y3 + curveParams.p) % curveParams.p];
  } catch (error) {
    console.error("Error during point addition:", error);
    return null;
  }
};

/**
 * Scalar multiplication (kG) on secp256k1 curve
 * This is the core cryptographic operation for generating public keys from private keys
 * @param k Scalar value (private key)
 * @param point Base point [x, y], defaults to generator point G
 * @returns Resulting point [x, y] (public key)
 */
export const scalarMultiply = (
  k: bigint, 
  point: [bigint, bigint] = [curveParams.Gx, curveParams.Gy]
): [bigint, bigint] | null => {
  try {
    const libCheck = checkBitcoinLibsLoaded();
    if (!libCheck.loaded) {
      throw new Error(`Bitcoin libraries not loaded: Missing ${libCheck.missing.join(', ')}`);
    }

    // Use secp256k1 library if available for most accurate and optimized results
    if (window && window.secp256k1) {
      try {
        // Special case: if k is 1, return the point directly
        if (k === 1n) return point;
        
        // Special case: if k is 0, return null (point at infinity)
        if (k === 0n) return null;
        
        // Handle generator point multiplication
        if (point[0] === curveParams.Gx && point[1] === curveParams.Gy) {
          // Convert scalar to byte array
          const kBytes = bigintToByteArray(k);
          
          // Use secp256k1.publicKeyCreate which multiplies the generator by scalar
          const result = window.secp256k1.publicKeyCreate(kBytes);
          
          // Convert result back to point coordinates
          return decompressPoint(result);
        } else {
          // For arbitrary point multiplication:
          // First convert the point to compressed form
          const pointCompressed = pointToCompressedHex(point);
          const pointBytes = hexStringToByteArray(pointCompressed);
          
          // Convert scalar to a properly sized byte array
          const kBytes = bigintToByteArray(k);
          
          // Use secp256k1.publicKeyTweakMul which multiplies a public key by a scalar
          const result = window.secp256k1.publicKeyTweakMul(pointBytes, kBytes);
          
          // Convert result back to point coordinates
          return decompressPoint(result);
        }
      } catch (err) {
        console.error("Error using secp256k1 for scalar multiplication:", err);
        // Fall back to manual implementation
      }
    }
    
    // Fall back to manual double-and-add implementation
    if (k === 0n) return null;
    if (k === 1n) return point;
    
    let result: [bigint, bigint] | null = null;
    let addend: [bigint, bigint] | null = point;
    let n = k;
    
    while (n > 0n) {
      if (n & 1n) {
        // Add current bit's contribution
        if (result === null) {
          result = addend;
        } else if (addend !== null) {
          result = pointAdd(result, addend);
        }
      }
      
      // Double the addend for next bit
      if (addend !== null) {
        addend = pointAdd(addend, addend);
      }
      
      // Shift to next bit
      n >>= 1n;
    }
    
    return result;
  } catch (error) {
    console.error("Error during scalar multiplication:", error);
    return null;
  }
};

/**
 * Helper: Convert point to compressed hex format
 * @param point Point coordinates [x, y]
 * @returns Compressed public key in hex format
 */
function pointToCompressedHex(point: [bigint, bigint]): string {
  const [x, y] = point;
  const xHex = x.toString(16).padStart(64, '0');
  const prefix = y % 2n === 0n ? '02' : '03';
  return prefix + xHex;
}

/**
 * Helper: Convert hex string to byte array
 * @param hex Hex string
 * @returns Uint8Array of bytes
 */
function hexStringToByteArray(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Helper: Convert bigint to byte array
 * @param n BigInt value
 * @returns Uint8Array of bytes (32 bytes for a 256-bit value)
 */
function bigintToByteArray(n: bigint): Uint8Array {
  const hex = n.toString(16).padStart(64, '0');
  return hexStringToByteArray(hex);
}

/**
 * Helper: Decompress a secp256k1 point from compressed or uncompressed format
 * @param pointBytes Compressed or uncompressed point bytes
 * @returns Point coordinates [x, y]
 */
function decompressPoint(pointBytes: Uint8Array): [bigint, bigint] {
  // Check if point is already uncompressed (starts with 0x04)
  let uncompressedBytes: Uint8Array;
  
  if (pointBytes[0] === 0x04) {
    uncompressedBytes = pointBytes;
  } else if (pointBytes[0] === 0x02 || pointBytes[0] === 0x03) {
    // It's compressed, use secp256k1 to decompress
    uncompressedBytes = window.secp256k1.publicKeyConvert(pointBytes);
  } else {
    throw new Error(`Invalid point format byte: ${pointBytes[0]}`);
  }
  
  // Extract x and y coordinates
  // Uncompressed format: 0x04 | x (32 bytes) | y (32 bytes)
  const xBytes = uncompressedBytes.slice(1, 33);
  const yBytes = uncompressedBytes.slice(33, 65);
  
  // Convert to BigInt
  let xBigInt = 0n;
  let yBigInt = 0n;
  
  for (let i = 0; i < 32; i++) {
    xBigInt = (xBigInt << 8n) | BigInt(xBytes[i]);
    yBigInt = (yBigInt << 8n) | BigInt(yBytes[i]);
  }
  
  return [xBigInt, yBigInt];
}
