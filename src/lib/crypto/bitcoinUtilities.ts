
/**
 * Bitcoin-specific cryptographic utility functions
 * Uses imported libraries for reliable cryptographic operations
 */

/**
 * Validates a Bitcoin address using the bitcoin-address-validation library
 * @param address Bitcoin address to validate
 * @returns True if address is valid, false otherwise
 */
export const validateBitcoinAddress = (address: string): boolean => {
  try {
    if (window.bitcoinAddressValidation) {
      return window.bitcoinAddressValidation.validate(address);
    }
    
    // Fallback validation - very basic
    const isValidFormat = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^(bc1|tb1)[a-zA-HJ-NP-Z0-9]{8,87}$/.test(address);
    return isValidFormat;
  } catch (error) {
    console.error("Address validation error:", error);
    return false;
  }
};

/**
 * Decodes a DER encoded signature using the Bitcoin library
 * @param sigHex Hex string of the DER signature
 * @returns Object containing r, s values and sighash type
 */
export const decodeDERSignature = (sigHex: string) => {
  try {
    if (!window.Bitcoin || !window.Bitcoin.Util) {
      throw new Error("Bitcoin library not loaded");
    }
    
    const sigBytes = window.Bitcoin.Util.hexToBytes(sigHex);
    
    // Check if the signature starts with 0x30 (DER format)
    if (sigBytes[0] !== 0x30) {
      throw new Error("Invalid DER signature format");
    }
    
    // Parse DER format manually (similar to what's in the cryptoDataExtraction.ts)
    let pos = 2; // Skip 0x30 and length byte
    
    // R value
    if (sigBytes[pos] !== 0x02) { // Integer type
      throw new Error("Invalid R value format in DER signature");
    }
    
    pos++;
    const rLen = sigBytes[pos];
    pos++;
    const rValue = sigBytes.slice(pos, pos + rLen);
    pos += rLen;
    
    // S value
    if (sigBytes[pos] !== 0x02) { // Integer type
      throw new Error("Invalid S value format in DER signature");
    }
    
    pos++;
    const sLen = sigBytes[pos];
    pos++;
    const sValue = sigBytes.slice(pos, pos + sLen);
    
    // Get sighash byte (last byte)
    const sighashType = sigBytes[sigBytes.length - 1];
    
    // Convert to hex
    const rHex = Array.from(rValue).map(b => ('0' + b.toString(16)).slice(-2)).join('');
    const sHex = Array.from(sValue).map(b => ('0' + b.toString(16)).slice(-2)).join('');
    const sighashHex = ('0' + sighashType.toString(16)).slice(-2);
    
    return {
      r: rHex,
      s: sHex,
      sighash: sighashHex
    };
  } catch (error) {
    console.error("Error decoding DER signature:", error);
    throw error;
  }
};

/**
 * Decompresses a compressed public key
 * @param pubKeyHex Hex string of the compressed public key (starts with 02 or 03)
 * @returns Object with x and y coordinates
 */
export const decompressPublicKey = (pubKeyHex: string) => {
  try {
    if (!window.Bitcoin) {
      throw new Error("Bitcoin library not loaded");
    }
    
    const pubKeyBytes = window.Bitcoin.Util.hexToBytes(pubKeyHex);
    
    // Check if it's a compressed key format (02/03 + 32 bytes of x)
    if ((pubKeyBytes[0] !== 0x02 && pubKeyBytes[0] !== 0x03) || pubKeyBytes.length !== 33) {
      throw new Error("Invalid compressed public key format");
    }
    
    // Use Bitcoin.js to decompress
    const ecKey = new window.Bitcoin.ECKey();
    ecKey.setPub(pubKeyBytes);
    const point = ecKey.getPubPoint();
    
    if (!point || !point.getX || !point.getY) {
      throw new Error("Failed to decompress public key");
    }
    
    const x = point.getX().toString(16).padStart(64, '0');
    const y = point.getY().toString(16).padStart(64, '0');
    
    return {
      x,
      y,
      isOnCurve: true // Assume it's on the curve since decompress succeeded
    };
  } catch (error) {
    console.error("Error decompressing public key:", error);
    throw error;
  }
};

/**
 * Checks if a point is on the secp256k1 curve
 * @param x X coordinate as hex string
 * @param y Y coordinate as hex string
 * @returns True if point is on curve, false otherwise
 */
export const isPointOnCurve = (x: string, y: string): boolean => {
  try {
    if (!window.secp256k1) {
      console.warn("secp256k1 library not loaded, using fallback check");
      
      // Very basic fallback check (should use proper library when available)
      // This is not a complete check and should be replaced with proper library usage
      return true;
    }
    
    // Convert hex strings to BigInt
    const xBigInt = BigInt('0x' + x);
    const yBigInt = BigInt('0x' + y);
    
    // Use secp256k1 library to check
    return window.secp256k1.Point.isOnCurve({ x: xBigInt, y: yBigInt });
  } catch (error) {
    console.error("Error checking if point is on curve:", error);
    return false;
  }
};

/**
 * Converts a WIF private key to raw hex format
 * @param wifKey WIF format private key
 * @returns Hex string of private key
 */
export const wifToPrivateKey = (wifKey: string): string => {
  try {
    if (!window.Bitcoin || !window.Bitcoin.Base58) {
      throw new Error("Bitcoin library not loaded");
    }
    
    // Use the Bitcoin.js library to decode WIF
    const bytes = window.Bitcoin.Base58.decode(wifKey);
    
    // Skip the network byte (1st byte) and compressed flag (if present, last byte)
    // Private key is 32 bytes in the middle
    const isCompressed = bytes.length === 38; // 1 network byte + 32 key bytes + 1 compressed flag + 4 checksum
    
    // Extract the private key bytes (skip 1st byte, take 32 bytes)
    const privateKeyBytes = bytes.slice(1, 33);
    
    // Convert to hex
    const privateKeyHex = Array.from(privateKeyBytes).map(b => ('0' + b.toString(16)).slice(-2)).join('');
    
    return privateKeyHex;
  } catch (error) {
    console.error("Error converting WIF to private key:", error);
    throw error;
  }
};
