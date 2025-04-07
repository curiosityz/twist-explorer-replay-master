
/**
 * Bitcoin utility functions using external libraries
 */

// Check if Bitcoin libraries are loaded
const checkBitcoinLibsLoaded = (): boolean => {
  return !!(
    window.Bitcoin && 
    window.bs58 && 
    window.bip39 && 
    window.bech32 && 
    window.secp256k1 && 
    window.bitcoinMessage && 
    window.bitcoinAddressValidation
  );
};

/**
 * Decode a DER signature from Bitcoin transaction
 * @param derHex Signature in DER format (hex string)
 * @returns Object with r and s values
 */
export const decodeDERSignature = (derHex: string): { r: string, s: string } => {
  try {
    // Validate input
    if (!derHex || typeof derHex !== 'string') {
      throw new Error('Invalid DER signature format');
    }
    
    // Remove any SIGHASH byte if present
    let hex = derHex;
    if (hex.length > 140) {
      hex = hex.slice(0, -2); // Remove last byte which is likely SIGHASH_ALL
    }
    
    console.log("Decoding DER signature:", hex);
    
    // Check if Bitcoin library is available 
    if (!checkBitcoinLibsLoaded()) {
      throw new Error("Bitcoin libraries not loaded");
    }
    
    // Use bitcoinjs parsing if available
    if (window.Bitcoin && window.Bitcoin.ECDSA) {
      console.log("Using Bitcoin.ECDSA to decode signature");
      const sig = window.Bitcoin.ECDSA.parseSig(hex);
      return {
        r: sig.r.toString(16).padStart(64, '0'),
        s: sig.s.toString(16).padStart(64, '0')
      };
    }
    
    // Manual DER parsing as fallback
    // DER format: 30 + len + 02 + rlen + r + 02 + slen + s
    if (!hex.startsWith('30')) {
      throw new Error('Invalid DER signature: missing header');
    }
    
    let position = 2; // Skip '30'
    const totalLen = parseInt(hex.slice(position, position + 2), 16);
    position += 2;
    
    if (hex.slice(position, position + 2) !== '02') {
      throw new Error('Invalid DER signature: missing first integer marker');
    }
    position += 2;
    
    const rLen = parseInt(hex.slice(position, position + 2), 16);
    position += 2;
    let r = hex.slice(position, position + rLen * 2);
    
    // Skip any leading zeros in r
    if (r.startsWith('00') && r.length > 64) {
      r = r.slice(2);
    }
    position += rLen * 2;
    
    if (hex.slice(position, position + 2) !== '02') {
      throw new Error('Invalid DER signature: missing second integer marker');
    }
    position += 2;
    
    const sLen = parseInt(hex.slice(position, position + 2), 16);
    position += 2;
    let s = hex.slice(position, position + sLen * 2);
    
    // Skip any leading zeros in s
    if (s.startsWith('00') && s.length > 64) {
      s = s.slice(2);
    }
    
    // Pad r and s to 64 characters (32 bytes)
    r = r.padStart(64, '0');
    s = s.padStart(64, '0');
    
    return { r, s };
  } catch (error) {
    console.error("Error decoding DER signature:", error);
    throw new Error(`Failed to decode DER signature: ${error.message}`);
  }
};

/**
 * Validate Bitcoin address format
 * @param address Bitcoin address to validate
 * @param network Optional network (mainnet/testnet)
 * @returns Boolean indicating if address is valid
 */
export const isValidBitcoinAddress = (
  address: string, 
  network: 'mainnet' | 'testnet' = 'mainnet'
): boolean => {
  if (!address) return false;
  
  try {
    // First try with bitcoin-address-validation library if available
    if (window.bitcoinAddressValidation) {
      console.log("Using bitcoinAddressValidation to validate address");
      return window.bitcoinAddressValidation.validate(address);
    }
    
    // Fallback to basic regex for common Bitcoin address patterns
    const p2pkhRegex = network === 'mainnet' 
      ? /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/ 
      : /^[mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
      
    const p2shRegex = network === 'mainnet' 
      ? /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/ 
      : /^2[a-km-zA-HJ-NP-Z1-9]{25,34}$/;
      
    const bech32Regex = network === 'mainnet' 
      ? /^bc1[a-zA-HJ-NP-Z0-9]{25,89}$/ 
      : /^tb1[a-zA-HJ-NP-Z0-9]{25,89}$/;
      
    return p2pkhRegex.test(address) || p2shRegex.test(address) || bech32Regex.test(address);
  } catch (error) {
    console.error("Error validating Bitcoin address:", error);
    return false;
  }
};

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
  } catch (error) {
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
    if (!compressedPubKeyHex || compressedPubKeyHex.length !== 66) {
      throw new Error("Invalid compressed public key format");
    }
    
    // Check if Bitcoin libraries are loaded
    if (!window.secp256k1) {
      throw new Error("secp256k1 library not loaded");
    }
    
    const prefix = compressedPubKeyHex.slice(0, 2);
    const xHex = compressedPubKeyHex.slice(2);
    
    if (prefix !== "02" && prefix !== "03") {
      throw new Error("Invalid public key prefix. Must be 02 or 03");
    }
    
    // Convert hex to Buffer/Uint8Array (as expected by secp256k1)
    const compressedPubKey = new Uint8Array(
      compressedPubKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    // Use secp256k1 library to decompress the key
    try {
      // Fix: Calling publicKeyConvert without any arguments
      const decompressedKey = window.secp256k1.publicKeyConvert(compressedPubKey);
      
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
      console.error("secp256k1 decompression error:", error);
      
      // Fallback implementation (if the library failed)
      const isYOdd = prefix === "03";
      
      // For fallback, we can only return the x coordinate and a placeholder for y
      return {
        x: xHex,
        y: "0".repeat(64), // Placeholder - proper implementation would compute y
        isOnCurve: false // We can't verify this without proper decompression
      };
    }
  } catch (error) {
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
    // Convert hex strings to BigInt
    const x = BigInt(`0x${xHex}`);
    const y = BigInt(`0x${yHex}`);
    
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
    
    // Fix: Call bs58.decode with just the wif string
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
  } catch (error) {
    console.error("Error converting WIF to private key:", error);
    return null;
  }
};

// For backward compatibility
export const validateBitcoinAddress = isValidBitcoinAddress;
export const isPointOnCurve = isPointOnSecp256k1Curve;
