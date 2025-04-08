
/**
 * Bitcoin address utility functions
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

// For backward compatibility
export const validateBitcoinAddress = isValidBitcoinAddress;

/**
 * Convert a wallet import format (WIF) private key to hex format
 * @param wif WIF format private key string
 * @returns Hex format private key or null if invalid
 */
export const wifToPrivateKey = (wif: string): string | null => {
  try {
    // Check if bs58 is available
    if (window.bs58) {
      let decoded: Uint8Array;
      
      // Handle different bs58 library implementations
      if (typeof window.bs58.decode === 'function') {
        try {
          // Use the imported decode function and explicitly cast the result
          decoded = window.bs58.decode(wif) as Uint8Array;
        } catch (decodeError) {
          console.error("Error decoding WIF with bs58:", decodeError);
          return null;
        }
      } else {
        console.error("bs58.decode is not a function");
        return null;
      }
      
      // Check if it's a valid WIF (should be either 33 or 34 bytes)
      if (decoded.length !== 33 && decoded.length !== 34) {
        console.error("Invalid WIF length");
        return null;
      }
      
      // Skip version byte (first) and checksum (last 4 bytes if compressed)
      // For compressed keys, also skip the compression flag
      const privateKeyBytes = decoded.length === 34 ? 
        decoded.slice(1, 33) : // Compressed key
        decoded.slice(1, 33);  // Uncompressed key
      
      // Convert to hex
      return Array.from(privateKeyBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } else {
      console.error("bs58 library not available for WIF decoding");
      return null;
    }
  } catch (error) {
    console.error("Error decoding WIF:", error);
    return null;
  }
};
