
/**
 * Utility functions for working with Bitcoin libraries
 */

/**
 * Map library aliases to their primary names
 * @param window The global window object
 */
export const mapLibraryAliases = (window: Window): void => {
  // Map library aliases to their primary names
  if (!window.Bitcoin && (window.bitcoin || window.bitcoinjs)) {
    window.Bitcoin = window.bitcoin || window.bitcoinjs;
    console.log("Mapped alternative Bitcoin library name to window.Bitcoin");
  }
  
  if (!window.secp256k1 && (window.nobleSecp256k1 || window.secp)) {
    window.secp256k1 = window.nobleSecp256k1 || window.secp;
    console.log("Mapped alternative secp256k1 library name");
  }
};

/**
 * Basic wrapper for Bitcoin library functionality
 * Used for consistent access to commonly used methods
 */
export const btc = {
  /**
   * Hash data using SHA256
   * @param data Data to hash
   * @returns SHA256 hash of the data
   */
  sha256: (data: Uint8Array): Uint8Array => {
    if (window.bitcoin?.crypto?.sha256) {
      return window.bitcoin.crypto.sha256(data);
    }
    
    if (window.Bitcoin?.crypto?.sha256) {
      return window.Bitcoin.crypto.sha256(data);
    }
    
    console.error("Bitcoin crypto library not available");
    // Return a mock hash for testing
    return new Uint8Array(32).fill(1);
  },
  
  /**
   * Create an OP_RETURN script
   * @param data Data to include in the OP_RETURN
   * @returns Script object
   */
  createOpReturnScript: (data: Buffer | Uint8Array): any => {
    if (window.bitcoin?.script?.compile) {
      return window.bitcoin.script.compile([
        window.bitcoin.opcodes.OP_RETURN,
        data
      ]);
    }
    
    if (window.Bitcoin?.script?.compile) {
      return window.Bitcoin.script.compile([
        window.Bitcoin.opcodes.OP_RETURN,
        data
      ]);
    }
    
    console.error("Bitcoin script library not available");
    return null;
  }
};

/**
 * Convert a string to bytes for input to cryptographic functions
 * @param str String to convert
 * @returns Uint8Array of bytes
 */
export function stringToBytes(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Convert bytes to a hex string
 * @param bytes Bytes to convert
 * @returns Hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert a hex string to bytes
 * @param hex Hex string to convert
 * @returns Uint8Array of bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  // Remove 0x prefix if present
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  
  // Ensure even length
  const paddedHex = cleanHex.length % 2 === 0 ? cleanHex : '0' + cleanHex;
  
  const bytes = new Uint8Array(paddedHex.length / 2);
  
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(paddedHex.substring(i * 2, i * 2 + 2), 16);
  }
  
  return bytes;
}
