
/**
 * Main export file for Bitcoin libraries utilities
 */

export { checkBitcoinLibsLoaded, isLibrariesLoaded } from './check-status';
export { checkAndLogLibraryStatus, mapLibraryAliases, refreshLibraryReferences } from './logging';
export type { BitcoinLibsCheckResult } from './types';
export { REQUIRED_LIBRARIES, LIBRARY_ALIASES } from './types';

/**
 * Check specific libraries required for a feature
 * @param feature Feature name for logging
 * @param requiredLibs Array of library names needed for the feature
 * @returns Boolean indicating if all required libraries are available
 */
export const checkRequiredLibraries = (requiredLibs: string[]): { loaded: boolean; missing: string[] } => {
  const missing = requiredLibs.filter(lib => !window[lib as keyof Window]);
  
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
