
/**
 * Logging utilities for Bitcoin libraries
 */
import { checkBitcoinLibsLoaded } from './check-status';
import { LIBRARY_ALIASES } from './types';

/**
 * Log Bitcoin library loading status
 * This can be called on application initialization
 */
export const checkAndLogLibraryStatus = (): void => {
  console.log("Checking Bitcoin libraries status...");
  
  // Check for alternate global names first and assign them if needed
  mapLibraryAliases();

  const status = checkBitcoinLibsLoaded();
  
  // Log individual library status for debugging
  console.log("Bitcoin libraries status:");
  console.log("- Bitcoin:", window.Bitcoin ? "Loaded" : "Not loaded");
  console.log("- bs58:", window.bs58 ? "Loaded" : "Not loaded");
  console.log("- bip39:", window.bip39 ? "Loaded" : "Not loaded");
  console.log("- bech32:", window.bech32 ? "Loaded" : "Not loaded");
  console.log("- secp256k1:", window.secp256k1 ? "Loaded" : "Not loaded");
  console.log("- nobleSecp256k1:", window.nobleSecp256k1 ? "Loaded" : "Not loaded");
  console.log("- secp:", window.secp ? "Loaded" : "Not loaded");
  console.log("- bitcoinMessage:", window.bitcoinMessage ? "Loaded" : "Not loaded");
  console.log("- bitcoinAddressValidation:", window.bitcoinAddressValidation ? "Loaded" : "Not loaded");
  
  if (!status.loaded) {
    console.warn(`Bitcoin libraries not loaded: Missing ${status.missing.join(', ')}`);
  } else {
    console.log("All Bitcoin libraries loaded successfully");
  }
};

/**
 * Map library aliases to their standard names
 * This ensures libraries loaded under alternative names are accessible via standard names
 */
export const mapLibraryAliases = (): void => {
  // Process each library and its aliases
  for (const [standardName, aliases] of Object.entries(LIBRARY_ALIASES)) {
    // Skip if standard name already exists
    if (window[standardName as keyof Window]) continue;
    
    // Try each alias
    for (const alias of aliases) {
      if (window[alias as keyof Window]) {
        window[standardName as keyof Window] = window[alias as keyof Window];
        console.log(`Assigned window.${alias} to window.${standardName}`);
        break;
      }
    }
  }
};

/**
 * Refresh library references that might have loaded after initial check
 */
export const refreshLibraryReferences = (): void => {
  // Map library aliases again to catch any libraries loaded later
  mapLibraryAliases();
  
  // Log updated status
  console.log("Library references refreshed. Current status:");
  console.log("- Bitcoin:", typeof window.Bitcoin !== 'undefined' ? "Available" : "Missing");
  console.log("- secp256k1:", typeof window.secp256k1 !== 'undefined' ? "Available" : "Missing");
};
