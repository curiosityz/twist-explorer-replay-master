
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
