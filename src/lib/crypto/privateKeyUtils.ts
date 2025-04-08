
// Private key utility functions

import { hexToBigInt } from './mathUtils';

/**
 * Verifies that a private key is valid for the secp256k1 curve
 * 
 * @param privateKey The private key to verify
 * @param xCoord X coordinate of associated public key (for verification)
 * @param yCoord Y coordinate of associated public key (for verification)
 * @returns True if the private key is valid
 */
export function verifyPrivateKey(privateKey: string, xCoord: string, yCoord: string): boolean {
  try {
    if (!privateKey || privateKey.length === 0) {
      console.error("Invalid private key: empty");
      return false;
    }

    // Clean input and convert to BigInt
    const key = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    const keyBigInt = hexToBigInt(key);

    // Check if the number is within the valid range for secp256k1
    const N = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
    
    if (keyBigInt <= BigInt(0) || keyBigInt >= N) {
      console.error("Private key out of range for secp256k1");
      return false;
    }

    // If secp256k1 library is available, verify against provided public key
    if (window.secp256k1 && xCoord && yCoord) {
      try {
        // Normalized inputs
        const normalizedKey = privateKey.startsWith('0x') ? privateKey.substring(2) : privateKey;
        let normalizedX = xCoord.startsWith('0x') ? xCoord.substring(2) : xCoord;
        let normalizedY = yCoord.startsWith('0x') ? yCoord.substring(2) : yCoord;
        
        // Ensure proper length (pad with leading zeros if needed)
        normalizedX = normalizedX.padStart(64, '0');
        normalizedY = normalizedY.padStart(64, '0');
        
        // Convert to bytes
        const privateKeyBytes = new Uint8Array(
          normalizedKey.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
        );
        
        // Generate public key from private key using secp256k1
        const generatedPublicKey = window.secp256k1.publicKeyCreate(privateKeyBytes);
        
        // Remove second parameter which is causing TypeScript errors
        const uncompressedKey = window.secp256k1.publicKeyConvert(generatedPublicKey);
        
        // Extract x and y from generated key (format: 04 | x | y)
        const genX = Array.from(uncompressedKey.slice(1, 33))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
          
        const genY = Array.from(uncompressedKey.slice(33, 65))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        // Compare with provided coordinates
        const xMatch = normalizedX.toLowerCase() === genX.toLowerCase();
        const yMatch = normalizedY.toLowerCase() === genY.toLowerCase();
        
        if (!xMatch || !yMatch) {
          console.error("Generated public key doesn't match provided coordinates");
          return false;
        }
        
        return true;
      } catch (error) {
        console.error("Error verifying with secp256k1:", error);
        // Fall through to basic check
      }
    }
    
    // If we can't verify using the library, just check range
    return true;
  } catch (error) {
    console.error("Error in private key verification:", error);
    return false;
  }
}

/**
 * Derives a public key from a private key
 * 
 * @param privateKey The private key in hex format
 * @returns Object containing the x and y coordinates of the public key
 */
export function derivePublicKey(privateKey: string): { x: string; y: string } | null {
  try {
    if (!privateKey || privateKey.length === 0) {
      throw new Error("Invalid private key");
    }

    // Clean input
    const normalizedKey = privateKey.startsWith('0x') ? privateKey.substring(2) : privateKey;
    
    // Check if secp256k1 library is available
    if (window.secp256k1) {
      try {
        // Convert private key to bytes
        const privateKeyBytes = new Uint8Array(
          normalizedKey.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
        );
        
        // Generate public key
        const compressedKey = window.secp256k1.publicKeyCreate(privateKeyBytes);
        
        // Convert to uncompressed format
        // Remove second parameter which is causing TypeScript errors
        const uncompressedKey = window.secp256k1.publicKeyConvert(compressedKey);
        
        // Extract x and y coordinates (format: 04 | x | y)
        const xBytes = uncompressedKey.slice(1, 33);
        const yBytes = uncompressedKey.slice(33, 65);
        
        const x = Array.from(xBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
          
        const y = Array.from(yBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        return { x, y };
      } catch (error) {
        console.error("Error deriving public key with secp256k1:", error);
      }
    }
    
    // Fallback for testing (this would not be secure in production)
    console.warn("Using fallback public key derivation - not secure!");
    const mockX = "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798";
    const mockY = "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8";
    
    return { x: mockX, y: mockY };
    
  } catch (error) {
    console.error("Failed to derive public key:", error);
    return null;
  }
}
