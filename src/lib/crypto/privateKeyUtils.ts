
import BigInt from 'big-integer';
import { hexToBigInt, bigIntToHex } from './mathUtils';
import { curveParams } from './constants';

/**
 * Convert a private key to public key
 * This is a crucial operation for Bitcoin wallet functionality
 * @param privateKey The private key as a hex string
 * @param compressed Whether to output compressed format
 * @returns Public key as { x, y } coordinates
 */
export const privateKeyToPublicKey = (privateKey: string, compressed = true): { x: string, y: string } => {
  // Remove '0x' prefix if present
  const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  
  try {
    // Check if the key is valid
    const privKeyBigInt = hexToBigInt(cleanPrivateKey);
    if (privKeyBigInt.lesser(0) || privKeyBigInt.greater(curveParams.n)) {
      throw new Error('Private key outside allowed range');
    }

    // Use the secp256k1 library if available
    if (window.secp256k1?.utils?.pointFromScalar) {
      // Use the native implementation from the secp256k1 library
      const privateKeyBytes = hexToBytes(cleanPrivateKey);
      const publicKeyBytes = window.secp256k1.utils.pointFromScalar(privateKeyBytes);
      
      if (publicKeyBytes) {
        // Parse the resulting point
        const x = bytesToHex(publicKeyBytes.slice(1, 33));
        const y = bytesToHex(publicKeyBytes.slice(33));
        
        return {
          x: `0x${x}`,
          y: `0x${y}`
        };
      }
    }
    
    // Fallback implementation if secp256k1 is not available
    // Using standard elliptic curve point multiplication: G * privKey
    
    // Start with generator point
    let x = curveParams.Gx;
    let y = curveParams.Gy;
    
    // Binary representation of private key for double-and-add algorithm
    const keyBits = privKeyBigInt.toString(2).split('').map(Number);
    
    // Double-and-add algorithm for scalar multiplication
    for (let i = 1; i < keyBits.length; i++) {
      // Double
      [x, y] = pointDouble(x, y);
      
      // Add if bit is 1
      if (keyBits[i] === 1) {
        [x, y] = pointAdd(x, y, curveParams.Gx, curveParams.Gy);
      }
    }
    
    return {
      x: `0x${x.toString(16).padStart(64, '0')}`,
      y: `0x${y.toString(16).padStart(64, '0')}`
    };
  } catch (error) {
    console.error('Error deriving public key:', error);
    throw new Error(`Failed to derive public key: ${error.message}`);
  }
};

/**
 * Simple function to convert public key to compressed format
 * @param x X coordinate of public key
 * @param y Y coordinate of public key
 * @returns Compressed public key in hex format
 */
export const compressPublicKey = (x: string, y: string): string => {
  try {
    if (window.secp256k1?.utils?.pointCompress) {
      const xClean = x.startsWith('0x') ? x.slice(2) : x;
      const yClean = y.startsWith('0x') ? y.slice(2) : y;
      
      // Format as uncompressed first
      const uncompressedHex = `04${xClean}${yClean}`;
      const uncompressedBytes = hexToBytes(uncompressedHex);
      
      // Then compress using the library
      const compressedBytes = window.secp256k1.utils.pointCompress(uncompressedBytes);
      
      return bytesToHex(compressedBytes);
    }
    
    // Manual compression if library not available
    const yValue = BigInt(y.startsWith('0x') ? y.slice(2) : y, 16);
    const prefix = yValue.isOdd() ? '03' : '02';
    const xHex = (x.startsWith('0x') ? x.slice(2) : x).padStart(64, '0');
    
    return prefix + xHex;
  } catch (error) {
    console.error("Error compressing public key:", error);
    throw new Error(`Failed to compress public key: ${error.message}`);
  }
};

// Utility function for private key derivation
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
  }
  
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Point operations for elliptic curve
function pointDouble(x: BigInt.BigInteger, y: BigInt.BigInteger): [BigInt.BigInteger, BigInt.BigInteger] {
  // Double a point on the curve
  const p = curveParams.p;
  const a = curveParams.a;
  
  // s = (3x²+ a) / 2y
  const threeX2 = BigInt(3).multiply(x.square()).mod(p);
  const numerator = threeX2.add(a).mod(p);
  const denominator = BigInt(2).multiply(y).mod(p);
  const s = numerator.multiply(modInverse(denominator, p)).mod(p);
  
  // x' = s² - 2x
  const xNew = s.square().subtract(BigInt(2).multiply(x)).mod(p);
  
  // y' = s(x-x') - y
  const yNew = s.multiply(x.subtract(xNew)).subtract(y).mod(p);
  
  return [xNew, yNew];
}

function pointAdd(x1: BigInt.BigInteger, y1: BigInt.BigInteger, x2: BigInt.BigInteger, y2: BigInt.BigInteger): [BigInt.BigInteger, BigInt.BigInteger] {
  // Add two points on the curve
  const p = curveParams.p;
  
  // Check for special cases
  if (x1.equals(0) && y1.equals(0)) return [x2, y2];
  if (x2.equals(0) && y2.equals(0)) return [x1, y1];
  
  if (x1.equals(x2)) {
    if (y1.equals(y2)) {
      return pointDouble(x1, y1);
    }
    // P + (-P) = O (point at infinity)
    return [BigInt(0), BigInt(0)];
  }
  
  // s = (y2 - y1) / (x2 - x1)
  const numerator = y2.subtract(y1).mod(p);
  const denominator = x2.subtract(x1).mod(p);
  const s = numerator.multiply(modInverse(denominator, p)).mod(p);
  
  // x3 = s² - x1 - x2
  const x3 = s.square().subtract(x1).subtract(x2).mod(p);
  
  // y3 = s(x1 - x3) - y1
  const y3 = s.multiply(x1.subtract(x3)).subtract(y1).mod(p);
  
  return [x3, y3];
}

function modInverse(a: BigInt.BigInteger, m: BigInt.BigInteger): BigInt.BigInteger {
  // Extended Euclidean algorithm for modular inverse
  let [old_r, r] = [a, m];
  let [old_s, s] = [BigInt(1), BigInt(0)];
  
  while (!r.equals(0)) {
    const quotient = old_r.divide(r);
    [old_r, r] = [r, old_r.subtract(quotient.multiply(r))];
    [old_s, s] = [s, old_s.subtract(quotient.multiply(s))];
  }
  
  // Make sure old_r = gcd(a,m) = 1
  if (!old_r.equals(1)) {
    throw new Error('Modular inverse does not exist');
  }
  
  return old_s.mod(m).add(m).mod(m); // Ensure result is positive
}
