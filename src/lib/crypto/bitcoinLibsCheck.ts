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
  const status = checkBitcoinLibsLoaded();
  return status.loaded;
};

/**
 * Log Bitcoin library loading status
 * This can be called on application initialization
 */
export const checkAndLogLibraryStatus = async (): Promise<void> => {
  const status = checkBitcoinLibsLoaded();
  if (!status.loaded) {
    console.warn(`Bitcoin libraries not loaded: Missing ${status.missing.join(', ')}`);
    console.log("Attempting to dynamically load missing libraries...");
    await loadMissingLibraries(status.missing);
  } else {
    console.log("All Bitcoin libraries loaded successfully");
  }
};

/**
 * Dynamically load missing Bitcoin libraries
 * @param missingLibs Array of missing library names
 */
const loadMissingLibraries = async (missingLibs: string[]): Promise<void> => {
  const libraryUrls: Record<string, string> = {
    'Bitcoin': 'https://cdnjs.cloudflare.com/ajax/libs/bitcoinjs-lib/5.2.0/bitcoinjs-lib.min.js',
    'bs58': 'https://cdnjs.cloudflare.com/ajax/libs/bs58/4.0.1/bs58.min.js',
    'bip39': 'https://cdnjs.cloudflare.com/ajax/libs/bip39/3.0.4/bip39.min.js',
    'bech32': 'https://cdnjs.cloudflare.com/ajax/libs/bech32/1.1.4/bech32.min.js',
    'secp256k1': 'https://cdnjs.cloudflare.com/ajax/libs/secp256k1/3.8.0/secp256k1.min.js',
    'bitcoinMessage': 'https://cdnjs.cloudflare.com/ajax/libs/bitcoinjs-message/2.0.0/bitcoinjs-message.min.js',
    'bitcoinAddressValidation': 'https://cdnjs.cloudflare.com/ajax/libs/bitcoin-address-validation/1.0.0/bitcoin-address-validation.min.js'
  };
  
  for (const lib of missingLibs) {
    if (libraryUrls[lib]) {
      await loadScript(libraryUrls[lib]);
    } else {
      console.warn(`No URL found for library: ${lib}`);
    }
  }
};

/**
 * Load a script dynamically
 * @param src URL of the script to load
 */
const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
};
