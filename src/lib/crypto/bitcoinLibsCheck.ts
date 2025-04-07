
/**
 * Utility to check if Bitcoin libraries are loaded
 */

// Global type for BitcoinJS library
declare global {
  interface Window {
    Bitcoin: any;
    bs58: any;
    bip39: any;
    bech32: any;
    secp256k1: any;
    bitcoinMessage: any;
    bitcoinOps: any;
    bitcoinAddressValidation: any;
  }
}

/**
 * Check if Bitcoin libraries are loaded
 * @returns Boolean indicating if all required libraries are available
 */
export const checkBitcoinLibsLoaded = (): boolean => {
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
