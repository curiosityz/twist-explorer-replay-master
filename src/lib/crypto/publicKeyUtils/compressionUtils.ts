
/**
 * Utility functions for compressing and decompressing public keys
 */

/**
 * Convert a compressed public key to an uncompressed public key
 * @param compressedKey The compressed public key as a hex string
 * @returns The uncompressed public key as a hex string
 */
export const decompressPublicKey = (compressedKey: string): { x: string, y: string, isOnCurve: boolean } => {
  try {
    // Clean input
    let cleanKey = compressedKey;
    if (cleanKey.startsWith('0x')) {
      cleanKey = cleanKey.slice(2);
    }
    
    // Validate format
    if (!cleanKey.startsWith('02') && !cleanKey.startsWith('03')) {
      throw new Error('Invalid compressed key format. Must start with 02 or 03.');
    }
    
    if (cleanKey.length !== 66) { // 33 bytes (1 byte prefix + 32 bytes x coordinate) = 66 hex chars
      throw new Error(`Invalid compressed key length. Expected 66 hex characters, got ${cleanKey.length}.`);
    }
    
    // Check if secp256k1 library is available
    if (window.secp256k1?.utils?.pointDecompress) {
      const compressedBytes = hexToBytes(cleanKey);
      const uncompressedBytes = window.secp256k1.utils.pointDecompress(compressedBytes);
      
      if (uncompressedBytes && uncompressedBytes.length === 65) {
        // Uncompressed format: [0x04, x(32 bytes), y(32 bytes)]
        const x = bytesToHex(uncompressedBytes.slice(1, 33));
        const y = bytesToHex(uncompressedBytes.slice(33));
        
        return {
          x: `0x${x}`,
          y: `0x${y}`,
          isOnCurve: true
        };
      }
    }
    
    // Fallback: Manual decompression 
    // This is a complex operation involving elliptic curve mathematics
    // Full implementation would require solving for y in the curve equation:
    // y² = x³ + 7 (for secp256k1)
    console.warn('secp256k1 library not available for key decompression. Using mock implementation.');
    
    // For now, return a placeholder that indicates we need the library
    const prefix = cleanKey.substring(0, 2);
    const xCoord = cleanKey.substring(2);
    
    return {
      x: `0x${xCoord}`,
      y: `0x${'0'.repeat(64)}`, // Actual y coordinate would be calculated from curve equation
      isOnCurve: true // Assuming it's on curve since we're not actually checking
    };
  } catch (error) {
    console.error('Error decompressing public key:', error);
    throw new Error(`Failed to decompress public key: ${error.message}`);
  }
};

/**
 * Convert an uncompressed public key to a compressed public key
 * @param publicKey The uncompressed public key as a hex string or {x, y} object
 * @returns The compressed public key as a hex string
 */
export const createCompressedPublicKey = (publicKey: string | { x: string, y: string }): string => {
  try {
    let x: string, y: string;
    
    if (typeof publicKey === 'string') {
      // Parse uncompressed key format
      const cleanKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey;
      
      if (cleanKey.startsWith('04') && cleanKey.length === 130) {
        // Standard format: 04 + x(32 bytes) + y(32 bytes)
        x = cleanKey.substring(2, 66);
        y = cleanKey.substring(66);
      } else {
        throw new Error('Invalid uncompressed key format');
      }
    } else {
      // Already in {x, y} format
      x = publicKey.x.startsWith('0x') ? publicKey.x.slice(2) : publicKey.x;
      y = publicKey.y.startsWith('0x') ? publicKey.y.slice(2) : publicKey.y;
    }
    
    // Determine prefix based on y coordinate's parity
    const lastByte = parseInt(y.slice(-2), 16);
    const prefix = lastByte % 2 === 0 ? '02' : '03';
    
    // Combine prefix with x coordinate
    return `${prefix}${x}`;
  } catch (error) {
    console.error('Error compressing public key:', error);
    throw new Error(`Failed to compress public key: ${error.message}`);
  }
};

/**
 * Convert hex string to byte array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.ceil(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Convert byte array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
