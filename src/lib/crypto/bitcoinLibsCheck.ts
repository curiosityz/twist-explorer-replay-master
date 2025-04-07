
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
    nobleSecp256k1: any;
    bitcoinMessage: any;
    bitcoinOps: any;
    bitcoinAddressValidation: any;
    bitcoinjs: any;
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
  
  // Check both direct library names and alternate global names
  const missing = requiredLibraries.filter(lib => {
    // If the library is directly available, it's not missing
    if (window[lib as keyof Window]) return false;
    
    // Check for alternate global names
    switch(lib) {
      case 'Bitcoin':
        return !window.bitcoinjs;
      case 'secp256k1':
        return !window.nobleSecp256k1;
      default:
        return true;
    }
  });
  
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

/**
 * Log Bitcoin library loading status
 * This can be called on application initialization
 */
export const checkAndLogLibraryStatus = (): void => {
  const status = checkBitcoinLibsLoaded();
  
  // Log individual library status for debugging
  console.log("Bitcoin libraries status:");
  console.log("- Bitcoin:", window.Bitcoin ? "Loaded" : "Not loaded");
  console.log("- bs58:", window.bs58 ? "Loaded" : "Not loaded");
  console.log("- bip39:", window.bip39 ? "Loaded" : "Not loaded");
  console.log("- bech32:", window.bech32 ? "Loaded" : "Not loaded");
  console.log("- secp256k1:", window.secp256k1 ? "Loaded" : "Not loaded");
  console.log("- bitcoinMessage:", window.bitcoinMessage ? "Loaded" : "Not loaded");
  console.log("- bitcoinAddressValidation:", window.bitcoinAddressValidation ? "Loaded" : "Not loaded");
  
  if (!status.loaded) {
    console.warn(`Bitcoin libraries not loaded: Missing ${status.missing.join(', ')}`);
  } else {
    console.log("All Bitcoin libraries loaded successfully");
  }
};
