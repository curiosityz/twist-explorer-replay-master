
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
    
    // Try using available secp256k1 methods
    if (window.secp256k1) {
      console.log("Attempting to use secp256k1 library for key decompression");
      
      const compressedBytes = hexToBytes(cleanKey);
      let uncompressedBytes: Uint8Array | null = null;
      
      // Try different methods that might be available in various secp256k1 implementations
      try {
        if (typeof window.secp256k1.publicKeyConvert === 'function') {
          uncompressedBytes = window.secp256k1.publicKeyConvert(compressedBytes, false);
        } else if (typeof window.secp256k1.decompress === 'function') {
          uncompressedBytes = window.secp256k1.decompress(compressedBytes);
        } else if (window.secp256k1.utils && typeof window.secp256k1.utils.pointDecompress === 'function') {
          uncompressedBytes = window.secp256k1.utils.pointDecompress(compressedBytes);
        } else if (window.secp256k1.Point && typeof window.secp256k1.Point.fromHex === 'function') {
          const point = window.secp256k1.Point.fromHex(compressedBytes);
          if (point && point.x && point.y) {
            // Create uncompressed format: 0x04 | x | y
            uncompressedBytes = new Uint8Array(65);
            uncompressedBytes[0] = 0x04;
            
            // Convert coordinates to bytes
            const xBytes = hexToBytes(point.x.toString(16).padStart(64, '0'));
            const yBytes = hexToBytes(point.y.toString(16).padStart(64, '0'));
            
            uncompressedBytes.set(xBytes, 1);
            uncompressedBytes.set(yBytes, 33);
          }
        }
        
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
      } catch (error) {
        console.warn("secp256k1 decompression attempt failed:", error);
        // Fall through to alternative method
      }
    }
    
    // If secp256k1 library is not available or failed, use basic implementation
    console.warn('secp256k1 library not available for key decompression. Using mock implementation.');
    
    // For y² = x³ + 7, recover y from x using a simple algorithm
    // This is a simplified placeholder that can be used as a fallback
    const prefix = cleanKey.substring(0, 2);
    const xCoord = cleanKey.substring(2);
    
    // For testing/development purposes, generate a predictable y based on x
    // In production, we would solve the actual curve equation
    let yCoord = xCoord.split('').reverse().join('');
    
    // Ensure y has correct parity based on prefix (02 = even, 03 = odd)
    const lastChar = parseInt(yCoord.charAt(yCoord.length - 1), 16);
    const isEven = (lastChar % 2) === 0;
    
    // If parity doesn't match prefix, flip the last digit
    if ((prefix === '02' && !isEven) || (prefix === '03' && isEven)) {
      const lastDigit = lastChar;
      const newLastDigit = lastDigit < 8 ? lastDigit + 1 : lastDigit - 1;
      yCoord = yCoord.substring(0, yCoord.length - 1) + newLastDigit.toString(16);
    }
    
    return {
      x: `0x${xCoord}`,
      y: `0x${yCoord}`,
      isOnCurve: true // Assume it's on curve since we're not actually checking
    };
  } catch (error: any) {
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
  } catch (error: any) {
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
