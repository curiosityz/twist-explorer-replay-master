
/**
 * Check Bitcoin library availability
 */

import { checkBitcoinLibsLoaded } from './bitcoin-libs/check-status';
import { refreshLibraryReferences } from './bitcoin-libs';
import { mapLibraryAliases } from './bitcoinUtilities';

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
  mapLibraryAliases(window);
  
  // Then check if libraries are loaded
  const status = checkBitcoinLibsLoaded();
  
  return {
    available: status.loaded,
    missingLibraries: status.missing
  };
}
