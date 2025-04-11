
/**
 * Main export file for Bitcoin libraries functionality
 */

import { REQUIRED_LIBRARIES, LIBRARY_ALIASES } from './types';
import { initializeMockLibraries } from './mock-libs';

export { checkBitcoinLibsLoaded, isLibrariesLoaded } from './check-status';
export type { BitcoinLibsCheckResult } from './types';
export { REQUIRED_LIBRARIES, LIBRARY_ALIASES } from './types';
export { initializeMockLibraries } from './mock-libs';
export { checkAndLogLibraryStatus } from './logging';

/**
 * Refresh references to ensure all available libraries are properly mapped
 */
export const refreshLibraryReferences = (): void => {
  // First check for ESM libraries which might be available but not on window
  const esmLibs = (window as any).esmLibraries || {};
  if (Object.keys(esmLibs).length > 0) {
    console.log("Found ESM libraries:", Object.keys(esmLibs));
    Object.entries(esmLibs).forEach(([name, lib]) => {
      if (!window[name as keyof Window]) {
        (window as any)[name] = lib;
        console.log(`Mapped ESM library ${name}`);
      }
    });
  }

  // Map library aliases to their primary names
  if (!window.Bitcoin && (window.bitcoin || window.bitcoinjs)) {
    window.Bitcoin = window.bitcoin || window.bitcoinjs;
    console.log("Mapped alternative Bitcoin library name to window.Bitcoin");
  }
  
  if (!window.secp256k1 && ((window as any).nobleSecp256k1 || (window as any).secp)) {
    window.secp256k1 = (window as any).nobleSecp256k1 || (window as any).secp;
    console.log("Mapped alternative secp256k1 library name");
  }
  
  // Check for common dynamic import patterns
  if ((window as any)._bitcoinLibs) {
    const dynamicLibs = (window as any)._bitcoinLibs;
    Object.entries(dynamicLibs).forEach(([name, lib]) => {
      if (!window[name as keyof Window]) {
        (window as any)[name] = lib;
        console.log(`Mapped dynamically loaded library ${name}`);
      }
    });
  }
  
  console.log("Library references refreshed");
};

/**
 * Check which required libraries are missing
 * @returns Array of missing library names
 */
export const checkRequiredLibraries = (): string[] => {
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
    initializeMockLibraries();
  }
};
