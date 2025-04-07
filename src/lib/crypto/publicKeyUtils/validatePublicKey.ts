
/**
 * Public key validation utilities
 */

import { CryptographicPoint } from '@/types';
import { isPointOnSecp256k1Curve } from './isPointOnCurve';

/**
 * Advanced validation of public key point
 * Checks if point is on curve and performs order validation when possible
 */
export const validatePublicKey = (xHex: string, yHex: string): { 
  isValid: boolean; 
  isOnCurve: boolean;
  reason?: string;
} => {
  try {
    // First check if it's on the curve
    const isOnCurve = isPointOnSecp256k1Curve(xHex, yHex);
    
    // If not on the curve, no need for further validation
    if (!isOnCurve) {
      return { 
        isValid: false, 
        isOnCurve: false,
        reason: "Point is not on the secp256k1 curve" 
      };
    }
    
    // Check if secp256k1 library is available for more advanced validation
    if (window.secp256k1) {
      try {
        // Convert to compressed format for validation
        const compressedKey = createCompressedPublicKey(xHex, yHex);
        
        // Convert hex to Buffer/Uint8Array
        const pubKeyBytes = new Uint8Array(
          compressedKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
        );
        
        // Use secp256k1 library to validate the key
        // This checks both that the point is on the curve AND that it has the correct order
        const isValid = window.secp256k1.publicKeyVerify(pubKeyBytes);
        
        return {
          isValid,
          isOnCurve: true,
          reason: isValid ? undefined : "Failed secp256k1 library validation (incorrect order)"
        };
      } catch (error) {
        console.error("Error in secp256k1 validation:", error);
        return {
          isValid: false,
          isOnCurve: true, // It's on the curve but fails additional validation
          reason: `secp256k1 validation error: ${error}`
        };
      }
    }
    
    // If we don't have the library for advanced validation,
    // we'll trust the on-curve check but warn about incomplete validation
    console.warn("secp256k1 library not available for complete validation");
    return { 
      isValid: true, 
      isOnCurve: true,
      reason: "Incomplete validation: secp256k1 library not available for order checking"
    };
  } catch (error) {
    console.error("Error validating public key:", error);
    return { 
      isValid: false, 
      isOnCurve: false,
      reason: `Validation error: ${error}` 
    };
  }
};

/**
 * Create compressed public key from x and y coordinates
 * @param x X coordinate (hex string)
 * @param y Y coordinate (hex string)
 * @returns Compressed public key as hex string
 */
export const createCompressedPublicKey = (x: string, y: string): string => {
  try {
    // Remove 0x prefix if present
    const xClean = x.startsWith('0x') ? x.slice(2) : x;
    const yClean = y.startsWith('0x') ? y.slice(2) : y;
    
    // Pad to 64 characters if needed
    const xPadded = xClean.padStart(64, '0');
    
    // Determine prefix based on y value (02 if even, 03 if odd)
    const isYEven = BigInt(`0x${yClean}`) % 2n === 0n;
    const prefix = isYEven ? '02' : '03';
    
    return prefix + xPadded;
  } catch (error: any) {
    console.error("Error creating compressed public key:", error);
    throw new Error(`Failed to create compressed public key: ${error.message}`);
  }
};
