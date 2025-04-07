
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
