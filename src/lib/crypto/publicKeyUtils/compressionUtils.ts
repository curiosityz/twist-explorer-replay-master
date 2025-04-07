
/**
 * Utilities for Bitcoin public key compression and decompression
 */

/**
 * Decompress a compressed public key
 * @param compressedKey Compressed public key (either as hex string or byte array)
 * @returns Object with x and y coordinates of the uncompressed key
 */
export function decompressPublicKey(compressedKey: string | Uint8Array): { x: string; y: string } {
  try {
    // Handle hex string input
    let keyBytes: Uint8Array;
    if (typeof compressedKey === 'string') {
      // Remove 0x prefix if present
      const cleanKey = compressedKey.startsWith('0x') ? compressedKey.slice(2) : compressedKey;
      
      // Validate hex format
      if (!/^[0-9a-fA-F]+$/.test(cleanKey)) {
        throw new Error('Invalid hex format for public key');
      }
      
      // Convert hex to bytes
      keyBytes = new Uint8Array(
        cleanKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      );
    } else {
      keyBytes = compressedKey;
    }
    
    // Check if the key is already uncompressed
    if (keyBytes.length === 65 && keyBytes[0] === 0x04) {
      // Extract x and y coordinates from uncompressed key
      const x = Array.from(keyBytes.slice(1, 33))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const y = Array.from(keyBytes.slice(33, 65))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      return { x: `0x${x}`, y: `0x${y}` };
    }
    
    // Check if the key is in compressed format
    if (keyBytes.length !== 33 || (keyBytes[0] !== 0x02 && keyBytes[0] !== 0x03)) {
      throw new Error('Invalid compressed key format');
    }
    
    // Check if secp256k1 library is available
    if (!window.secp256k1) {
      throw new Error('secp256k1 library not loaded');
    }
    
    // Use the secp256k1 library to convert to uncompressed format
    const uncompressedKey = window.secp256k1.publicKeyConvert(keyBytes);
    
    // Extract x and y coordinates from uncompressed key
    const x = Array.from(uncompressedKey.slice(1, 33))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const y = Array.from(uncompressedKey.slice(33, 65))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return { x: `0x${x}`, y: `0x${y}` };
  } catch (error) {
    console.error('Error decompressing public key:', error);
    throw error;
  }
}
