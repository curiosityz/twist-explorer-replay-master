
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
 * @returns Result object with status and missing libraries
 */
export const checkBitcoinLibsLoaded = (): { loaded: boolean; missing: string[] } => {
  const requiredLibraries = [
    'Bitcoin',
    'bs58',
    'bip39',
    'bech32',
    'secp256k1',
    'bitcoinMessage',
    'bitcoinAddressValidation'
  ];
  
  const missing = requiredLibraries.filter(lib => !window[lib as keyof Window]);
  
  return {
    loaded: missing.length === 0,
    missing
  };
};

/**
 * Legacy check for backward compatibility
 * @returns Boolean indicating if all required libraries are available
 */
export const isLibrariesLoaded = (): boolean => {
  return checkBitcoinLibsLoaded().loaded;
};
