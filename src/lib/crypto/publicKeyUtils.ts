
/**
 * Bitcoin public key utilities
 */

import { checkBitcoinLibsLoaded } from './bitcoinLibsCheck';

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
      // Use try-catch for the decompression operation
      let decompressedKey;
      try {
        // Fix: Call publicKeyConvert without additional parameters
        decompressedKey = window.secp256k1.publicKeyConvert(compressedPubKey);
      } catch (decompError) {
        console.error("secp256k1 decompression error:", decompError);
        throw new Error(`secp256k1 decompression failed: ${decompError}`);
      }
      
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
      
      // Fallback implementation (if the library failed)
      const isYOdd = prefix === "03";
      
      // For fallback, we can only return the x coordinate and a placeholder for y
      return {
        x: xHex,
        y: "0".repeat(64), // Placeholder - proper implementation would compute y
        isOnCurve: false // We can't verify this without proper decompression
      };
    }
  } catch (error: any) {
    console.error("Error decompressing public key:", error);
    throw new Error(`Failed to decompress public key: ${error.message}`);
  }
};

/**
 * Check if a point is on the secp256k1 curve
 * @param xHex X coordinate (hex string)
 * @param yHex Y coordinate (hex string)
 * @returns Boolean indicating if the point is on the curve
 */
export const isPointOnSecp256k1Curve = (xHex: string, yHex: string): boolean => {
  try {
    // Clean inputs - remove 0x prefix if present
    const xClean = xHex.startsWith('0x') ? xHex.slice(2) : xHex;
    const yClean = yHex.startsWith('0x') ? yHex.slice(2) : yHex;
    
    // Validate inputs
    if (!/^[0-9a-fA-F]+$/.test(xClean) || !/^[0-9a-fA-F]+$/.test(yClean)) {
      console.error("Invalid hex format in coordinates");
      return false;
    }
    
    // Convert hex strings to BigInt
    const x = BigInt(`0x${xClean}`);
    const y = BigInt(`0x${yClean}`);
    
    // secp256k1 curve parameters
    const p = 2n ** 256n - 2n ** 32n - 2n ** 9n - 2n ** 8n - 2n ** 7n - 2n ** 6n - 2n ** 4n - 1n; // Field prime
    const a = 0n; // Curve coefficient a
    const b = 7n; // Curve coefficient b
    
    // Check if y² ≡ x³ + ax + b (mod p)
    // For secp256k1, this simplifies to y² ≡ x³ + 7 (mod p)
    const left = (y * y) % p;
    const right = (((x * x * x) % p) + b) % p;
    
    return left === right;
  } catch (error) {
    console.error("Error checking if point is on curve:", error);
    return false;
  }
};

// For backward compatibility
export const isPointOnCurve = isPointOnSecp256k1Curve;

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
        // This will throw if the key is invalid
        const isValid = window.secp256k1.publicKeyVerify(pubKeyBytes);
        
        return {
          isValid: isValid,
          isOnCurve: true,
          reason: isValid ? undefined : "Failed secp256k1 library validation"
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
    // we'll trust the on-curve check
    return { 
      isValid: true, 
      isOnCurve: true 
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
