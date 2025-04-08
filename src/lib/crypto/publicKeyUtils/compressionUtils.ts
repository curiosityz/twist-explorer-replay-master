
/**
 * Public key compression and decompression utilities
 */

import { isPointOnCurve } from './isPointOnCurve';

/**
 * Compress a public key from its x and y coordinates
 * @param x X coordinate in hex format
 * @param y Y coordinate in hex format
 * @returns Compressed public key in hex format
 */
export function createCompressedPublicKey(x: string, y: string): string {
  // Ensure hex strings are properly formatted
  const xHex = x.startsWith('0x') ? x.slice(2) : x;
  const yHex = y.startsWith('0x') ? y.slice(2) : y;
  
  // Even or odd y value determines prefix (02 for even, 03 for odd)
  const lastYByte = parseInt(yHex.slice(-2), 16);
  const prefix = lastYByte % 2 === 0 ? '02' : '03';
  
  // Compressed public key is prefix + x coordinate
  return prefix + xHex.padStart(64, '0');
}

/**
 * Decompress a public key to get its x and y coordinates
 * @param compressedKey Compressed public key in hex format
 * @returns Object with x, y coordinates and validity flag
 */
export function decompressPublicKey(compressedKey: string): { x: string; y: string; isOnCurve: boolean } {
  try {
    // Check if secp256k1 library is available for decompression
    if (window.secp256k1) {
      try {
        // Remove 0x prefix if present
        const cleanKey = compressedKey.startsWith('0x') ? compressedKey.slice(2) : compressedKey;
        
        // Convert hex to bytes
        const keyBytes = new Uint8Array(
          cleanKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
        );
        
        // Use secp256k1 library to decompress the key
        // Fixed: Remove the second parameter from publicKeyConvert
        const decompressed = window.secp256k1.publicKeyConvert(keyBytes);
        
        // Extract x and y coordinates (format: 04 | x | y)
        const xBytes = decompressed.slice(1, 33);
        const yBytes = decompressed.slice(33, 65);
        
        const xHex = Array.from(xBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
          
        const yHex = Array.from(yBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        // Check if the resulting point is on the curve
        const isValid = isPointOnCurve(BigInt('0x' + xHex), BigInt('0x' + yHex));
        
        return {
          x: xHex,
          y: yHex,
          isOnCurve: isValid
        };
      } catch (error) {
        console.error("Error using secp256k1 for decompression:", error);
        // Fall back to manual decompression if secp256k1 fails
      }
    }
    
    // Manual decompression fallback
    // This is a simplified implementation - in production, use a full library
    console.warn("Using fallback decompression - less reliable");
    
    const cleanKey = compressedKey.startsWith('0x') ? compressedKey.slice(2) : compressedKey;
    
    if (cleanKey.length < 66) {
      throw new Error("Invalid compressed key length");
    }
    
    const prefix = cleanKey.substring(0, 2);
    const xHex = cleanKey.substring(2, 66);
    
    if (prefix !== '02' && prefix !== '03') {
      throw new Error(`Invalid compression prefix: ${prefix}`);
    }
    
    const isEven = prefix === '02';
    
    // For fallback: create a placeholder y value
    // In a real implementation, calculate y using curve equation y² = x³ + 7 mod p
    // and pick the solution with matching parity
    const dummyY = isEven ? 
      '1111111111111111111111111111111111111111111111111111111111111111' : 
      '2222222222222222222222222222222222222222222222222222222222222222';
    
    return {
      x: xHex,
      y: dummyY,
      isOnCurve: false // Since we're not actually calculating the correct y
    };
  } catch (error) {
    console.error("Error decompressing public key:", error);
    throw new Error("Failed to decompress public key");
  }
}
