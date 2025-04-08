
/**
 * Check Bitcoin library availability
 */

import { checkBitcoinLibsLoaded } from './bitcoin-libs/check-status';
import { refreshLibraryReferences as refreshReferences } from './bitcoin-libs';
import { mapLibraryAliases } from './bitcoinUtilities';

/**
 * Refresh library references to ensure all available libraries are found
 */
export const refreshLibraryReferences = (): void => {
  // Map library aliases to their primary names
  refreshReferences();
  mapLibraryAliases(window);
};

/**
 * Check if all required Bitcoin libraries are loaded
 * @returns Object containing loaded status and missing libraries
 */
export function areBitcoinLibrariesAvailable(): { 
  available: boolean;
  missingLibraries: string[];
} {
  // First refresh library mappings to ensure all available libraries are found
  refreshLibraryReferences();
  
  // Then check if libraries are loaded
  const status = checkBitcoinLibsLoaded();
  
  return {
    available: status.loaded,
    missingLibraries: status.missing
  };
}

// Re-export the check function for compatibility
export { checkBitcoinLibsLoaded } from './bitcoin-libs/check-status';
