/**
 * Private key utilities for Bitcoin
 */

import { checkBitcoinLibsLoaded } from './bitcoinLibsCheck';
import { validatePrivateKey } from './keyUtils';

/**
 * Check if a string is a valid WIF (Wallet Import Format) private key
 * @param wif The WIF string to validate
 * @returns Boolean indicating if the WIF is valid
 */
export const isValidWIF = (wif: string): boolean => {
  try {
    // Basic validation - WIF should be base58 encoded string
    // with specific lengths: 51-52 characters for mainnet
    if (!wif || typeof wif !== 'string') {
      return false;
    }
    
    // Check length (mainnet compressed: 52 chars, uncompressed: 51 chars)
    // Testnet has different lengths but similar structure
    if (wif.length < 50 || wif.length > 54) {
      return false;
    }
    
    // Check for valid prefix - mainnet WIFs start with '5', 'K', or 'L'
    const validMainnetPrefixes = ['5', 'K', 'L'];
    // Testnet WIFs start with '9' or 'c'
    const validTestnetPrefixes = ['9', 'c'];
    
    // Combined valid prefixes
    const validPrefixes = [...validMainnetPrefixes, ...validTestnetPrefixes];
    if (!validPrefixes.includes(wif.charAt(0))) {
      return false;
    }
    
    // Check if bitcoinjs library is available for full validation
    const libCheck = checkBitcoinLibsLoaded();
    if (!libCheck.loaded) {
      console.warn("Bitcoin libraries not fully loaded, performing basic WIF validation only");
      return true; // Return true based on prefix and length checks if libraries not available
    }
    
    // If we have the BS58 library, we can do proper checksum validation
    if (window.bs58) {
      try {
        // Decode the base58 string
        const decoded = window.bs58.decode(wif);
        
        // Check length of decoded data
        // WIF format: [1 byte version][32 bytes private key][optional 1 byte compression flag][4 bytes checksum]
        // So valid lengths are 37 bytes (uncompressed) or 38 bytes (compressed)
        if (decoded.length !== 37 && decoded.length !== 38) {
          return false;
        }
        
        // Validate checksum
        const checksum = decoded.slice(-4);
        const data = decoded.slice(0, -4);
        const hash1 = sha256(data);
        const hash2 = sha256(hash1);
        const validChecksum = hash2.slice(0, 4);
        
        return checksum.every((byte, index) => byte === validChecksum[index]);
      } catch (e) {
        return false; // Decoding failed, invalid Base58
      }
    }
    
    // If bs58 is not available, return true based on prefix and length checks
    return true;
  } catch (error) {
    console.error("Error validating WIF:", error);
    return false;
  }
};

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
    const libCheck = checkBitcoinLibsLoaded();
    if (!libCheck.loaded) {
      throw new Error(`Bitcoin libraries not loaded: Missing ${libCheck.missing.join(', ')}`);
    }
    
    // Validate WIF format before decoding
    if (!/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{51,52}$/.test(wif)) {
      throw new Error("Invalid WIF format - should be 51-52 Base58 characters");
    }
    
    // Call bs58.decode - it expects just the string, without any parameters
    const bytes = window.bs58.decode(wif);
    
    // WIF format: version(1) + key(32) + [compressed-flag(1)] + checksum(4)
    // Validate length (37 for uncompressed, 38 for compressed)
    if (bytes.length !== 37 && bytes.length !== 38) {
      throw new Error(`Invalid WIF length: ${bytes.length}`);
    }
    
    // Extract private key (skip version byte, take 32 bytes)
    const privateKeyBytes = bytes.slice(1, 33);
    
    // Convert to hex
    const privateKeyHex = Array.from(privateKeyBytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
      
    // Basic validation of the extracted key
    if (privateKeyHex.length !== 64 || !/^[0-9a-f]+$/i.test(privateKeyHex)) {
      throw new Error("Invalid private key hex format after extraction");
    }
    
    // Validate the private key
    if (!validatePrivateKey(privateKeyHex)) {
      throw new Error("Invalid private key after extraction");
    }
    
    return privateKeyHex;
  } catch (error: any) {
    console.error("Error converting WIF to private key:", error);
    return null;
  }
};

/**
 * Validate a private key is within the valid range for secp256k1
 * @param privateKey Private key as hex string
 * @returns Boolean indicating if the key is valid
 */
export const validatePrivateKey = (privateKey: string): boolean => {
  try {
    // Clean input - remove 0x prefix if present
    const keyClean = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    
    // Validate hex format
    if (!/^[0-9a-fA-F]+$/.test(keyClean)) {
      console.error("Invalid hex format in private key");
      return false;
    }
    
    // Convert to BigInt
    const keyValue = BigInt(`0x${keyClean}`);
    
    // secp256k1 curve order
    const n = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
    
    // Check if in range: 0 < key < n
    return keyValue > 0n && keyValue < n;
  } catch (error) {
    console.error("Error validating private key:", error);
    return false;
  }
};

/**
 * Convert private key from raw hex to WIF format
 * @param privateKeyHex Private key in hex format
 * @param compressed Whether to use compressed format
 * @returns WIF formatted private key
 */
export const privateKeyToWif = (privateKeyHex: string, compressed = true): string | null => {
  try {
    // Check if Bitcoin libraries are loaded
    const libCheck = checkBitcoinLibsLoaded();
    if (!libCheck.loaded) {
      throw new Error(`Bitcoin libraries not loaded: Missing ${libCheck.missing.join(', ')}`);
    }
    
    // Clean input - remove 0x prefix if present
    const keyClean = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex;
    
    // Validate hex format
    if (!/^[0-9a-fA-F]{64}$/.test(keyClean)) {
      throw new Error("Invalid hex format or length in private key");
    }
    
    // Convert hex to bytes
    const keyBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      keyBytes[i] = parseInt(keyClean.substr(i * 2, 2), 16);
    }
    
    // Create WIF format:
    // 1. Create array with version byte (0x80 for mainnet)
    const wifBytes = [0x80];
    
    // 2. Append key bytes
    for (let i = 0; i < keyBytes.length; i++) {
      wifBytes.push(keyBytes[i]);
    }
    
    // 3. Append compressed flag if needed
    if (compressed) {
      wifBytes.push(0x01);
    }
    
    // 4. Calculate checksum (SHA256(SHA256(version + key + [compressed])))
    const checksum = sha256(sha256(new Uint8Array(wifBytes)));
    
    // 5. Append first 4 bytes of checksum
    for (let i = 0; i < 4; i++) {
      wifBytes.push(checksum[i]);
    }
    
    // 6. Convert to Base58
    return window.bs58.encode(new Uint8Array(wifBytes));
  } catch (error: any) {
    console.error("Error converting private key to WIF:", error);
    return null;
  }
};

// Helper function for SHA256 (if window.Bitcoin is available)
function sha256(data: Uint8Array): Uint8Array {
  if (window.Bitcoin && window.Bitcoin.crypto) {
    return window.Bitcoin.crypto.sha256(data);
  }
  
  // Fallback - in a real implementation we'd have a pure JS SHA256
  throw new Error("Bitcoin crypto library not available for SHA256");
}
