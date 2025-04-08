
/**
 * Main export file for Bitcoin libraries functionality
 */

export { checkBitcoinLibsLoaded, isLibrariesLoaded } from './check-status';
export type { BitcoinLibsCheckResult } from './types';
export { REQUIRED_LIBRARIES, LIBRARY_ALIASES } from './types';
export { initializeMockLibraries } from './mock-libs';
export { checkAndLogLibraryStatus } from './logging';

/**
 * Map library aliases to their primary names
 * @param window The global window object
 */
export const mapLibraryAliases = (window: Window): void => {
  // Map library aliases to their primary names
  if (!window.Bitcoin && (window.bitcoin || window.bitcoinjs)) {
    window.Bitcoin = window.bitcoin || window.bitcoinjs;
    console.log("Mapped alternative Bitcoin library name to window.Bitcoin");
  }
  
  if (!window.secp256k1 && (window.nobleSecp256k1 || window.secp)) {
    window.secp256k1 = window.nobleSecp256k1 || window.secp;
    console.log("Mapped alternative secp256k1 library name");
  }
};

/**
 * Refresh references to ensure all available libraries are properly mapped
 */
export const refreshLibraryReferences = (): void => {
  // Refresh references to ensure all available libraries are properly mapped
  mapLibraryAliases(window);
  console.log("Library references refreshed");
};

/**
 * Check which required libraries are missing
 * @returns Array of missing library names
 */
export const checkRequiredLibraries = (): string[] => {
  const { REQUIRED_LIBRARIES, LIBRARY_ALIASES } = require('./types');
  
  return REQUIRED_LIBRARIES.filter(lib => {
    // Check for direct references
    if (window[lib as keyof Window]) {
      return false;
    }
    
    // Check for aliases
    const aliases = LIBRARY_ALIASES[lib] || [];
    return !aliases.some(alias => window[alias as keyof Window]);
  });
};

/**
 * Handle missing libraries by creating mocks as needed
 * @param missingLibs Array of missing library names
 */
export const handleMissingLibraries = (missingLibs: string[]): void => {
  if (missingLibs.length > 0) {
    console.warn(`Missing libraries: ${missingLibs.join(', ')}`);
    // Attempt to create mock implementations for critical libraries
    if (missingLibs.includes('Bitcoin') && window.secp256k1) {
      console.warn("Creating mock Bitcoin implementation using secp256k1");
      (window as any).Bitcoin = {
        crypto: {
          sha256: (data: Uint8Array) => {
            console.warn("Using mock SHA256 implementation - not secure!");
            return new Uint8Array(32).fill(1);
          }
        }
      };
    }
  }
};
