
/**
 * Bitcoin private key utility functions
 */

/**
 * Convert WIF format private key to raw hex
 * @param wif Private key in WIF format
 * @returns Private key as hex string or null if invalid
 */
export const wifToPrivateKey = (wif: string): string | null => {
  try {
    if (!wif || typeof wif !== 'string') {
      throw new Error("Invalid WIF format");
    }
    
    // Check if Bitcoin libraries are loaded
    if (!window.bs58) {
      throw new Error("bs58 library not loaded");
    }
    
    // Fix: Call bs58.decode without format parameter
    const bytes = window.bs58.decode(wif);
    
    // WIF format: version(1) + key(32) + [compressed-flag(1)] + checksum(4)
    // Validate length (37 for uncompressed, 38 for compressed)
    if (bytes.length !== 37 && bytes.length !== 38) {
      throw new Error("Invalid WIF length");
    }
    
    // Extract private key (skip version byte, take 32 bytes)
    const privateKeyBytes = bytes.slice(1, 33);
    
    // Convert to hex
    const privateKeyHex = Array.from(privateKeyBytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
      
    return privateKeyHex;
  } catch (error: any) {
    console.error("Error converting WIF to private key:", error);
    return null;
  }
};
