/**
 * Bitcoin library initialization and status checking
 */
import { checkAndLogLibraryStatus, checkBitcoinLibsLoaded } from './bitcoinLibsCheck';

/**
 * Initialize Bitcoin libraries and check loading status
 * This should be called early in your application startup
 * @returns Object with status and any missing libraries
 */
export const initializeBitcoinLibraries = async (): Promise<{ loaded: boolean; missing: string[] }> => {
  console.log("Initializing Bitcoin libraries...");
  
  // Log the status of library loading
  checkAndLogLibraryStatus();
  
  // Return the current status
  const status = checkBitcoinLibsLoaded();
  
  if (!status.loaded) {
    console.log("Attempting to dynamically load missing libraries...");
    await loadMissingLibraries(status.missing);
  }
  
  return checkBitcoinLibsLoaded();
};

/**
 * Check if required libraries for a specific operation are available
 * @param requiredLibs Array of specific library names needed
 * @returns Object with status and any missing libraries from the required set
 */
export const checkRequiredLibraries = async (requiredLibs: string[]): Promise<{ loaded: boolean; missing: string[] }> => {
  const missing = requiredLibs.filter(lib => !window[lib as keyof Window]);
  
  if (missing.length > 0) {
    console.log("Attempting to dynamically load missing required libraries...");
    await loadMissingLibraries(missing);
  }
  
  return {
    loaded: missing.length === 0,
    missing
  };
};

/**
 * Handle the case where required libraries are missing
 * @param missingLibs Array of missing library names
 * @returns Error message
 */
export const handleMissingLibraries = (missingLibs: string[]): Error => {
  const errorMessage = `Required Bitcoin libraries not loaded: Missing ${missingLibs.join(', ')}`;
  console.error(errorMessage);
  
  // Here we could potentially add code to dynamically load the missing libraries
  // For now, we just return an error
  
  return new Error(errorMessage);
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
