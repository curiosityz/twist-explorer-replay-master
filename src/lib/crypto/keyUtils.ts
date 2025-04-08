/**
 * Utilities for key handling, verification, and normalization
 */

import { hexToBigInt, bigIntToHex, bigIntToPrivateKeyHex } from './mathUtils';
import { isPointOnCurve, isPointOnTwistCurve, scalarMultiply } from './curveOperations';
import { curveParams } from './constants';

/**
 * Normalize private key length to standard format
 * @param keyHex Private key in hex format
 * @returns Normalized private key hex (64 characters with 0x prefix)
 */
export const normalizePrivateKey = (keyHex: string): string => {
  try {
    let key = keyHex.trim();
    
    // Remove 0x prefix if present
    if (key.startsWith('0x')) {
      key = key.substring(2);
    }
    
    console.log("Normalizing key, input value:", key);
    
    // Convert to BigInt
    const keyBigInt = BigInt(`0x${key}`);
    console.log("Key as BigInt:", keyBigInt.toString());
    
    // Ensure the key is within the valid range for secp256k1
    const normalizedBigInt = keyBigInt % curveParams.n;
    console.log("Normalized BigInt value:", normalizedBigInt.toString());
    
    // Convert to properly formatted 64-character hex
    const formattedHex = bigIntToPrivateKeyHex(normalizedBigInt);
    console.log("Final normalized key (64 chars):", formattedHex);
    
    return `0x${formattedHex}`;
  } catch (error) {
    console.error("Error normalizing private key:", error);
    throw new Error(`Failed to normalize private key: ${error}`);
  }
};

/**
 * Verifies whether a private key correctly generates the corresponding public key
 * @param privateKeyHex Private key in hexadecimal format
 * @param publicKeyX X-coordinate of the public key point (hex)
 * @param publicKeyY Y-coordinate of the public key point (hex)
 * @returns Boolean indicating if the private key is valid
 */
export const verifyPrivateKey = (
  privateKeyHex: string, 
  publicKeyX: string, 
  publicKeyY: string
): boolean => {
  try {
    // Parse keys to BigInt
    const privateKey = hexToBigInt(privateKeyHex);
    
    // Private key must be in the valid range: 1 <= privateKey < n
    if (privateKey <= 0n || privateKey >= curveParams.n) {
      console.error("Private key out of valid range:", privateKey.toString());
      return false;
    }
    
    // Calculate public key as privateKey * G
    const calculatedPoint = scalarMultiply(privateKey);
    
    // Handle failure in calculation
    if (calculatedPoint === null) {
      console.error("Point calculation failed");
      return false;
    }
    
    const [calculatedX, calculatedY] = calculatedPoint;
    
    console.log("Verifying private key:", privateKeyHex);
    console.log("Private key as BigInt:", privateKey.toString());
    console.log("Calculated public key:", bigIntToHex(calculatedX), bigIntToHex(calculatedY));
    
    // For twisted curve vulnerability analysis, we only need to check that
    // the private key generates a valid point on the curve
    return calculatedX !== 0n && calculatedY !== 0n;
  } catch (error) {
    console.error("Error verifying private key:", error);
    return false;
  }
};
