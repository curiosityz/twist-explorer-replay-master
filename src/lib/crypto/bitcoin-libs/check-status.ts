
/**
 * Core functionality for checking Bitcoin libraries status
 */
import { BitcoinLibsCheckResult, REQUIRED_LIBRARIES, LIBRARY_ALIASES } from './types';

/**
 * Check if Bitcoin libraries are loaded
 * @returns Result object with status and missing libraries
 */
export const checkBitcoinLibsLoaded = (): BitcoinLibsCheckResult => {
  // For logging which library variants we actually found
  const foundLibraries: Record<string, string> = {};
  
  // Check both direct library names and alternate global names
  const missing = REQUIRED_LIBRARIES.filter(lib => {
    // Direct check for the primary library name
    if (window[lib as keyof Window]) {
      foundLibraries[lib] = lib;
      return false;
    }
    
    // Check for alternate global names
    const aliases = LIBRARY_ALIASES[lib] || [];
    for (const alias of aliases) {
      if (window[alias as keyof Window]) {
        // If found by alias, assign to main name if not already present
        if (!window[lib as keyof Window]) {
          (window as any)[lib] = window[alias as keyof Window];
        }
        foundLibraries[lib] = alias;
        return false;
      }
    }
    
    // Check if library was loaded as an ESM module (might not be on window)
    const esmVersions = (window as any).esmLibraries;
    if (esmVersions && esmVersions[lib]) {
      // Map the ESM module to the global name
      (window as any)[lib] = esmVersions[lib];
      foundLibraries[lib] = `esm:${lib}`;
      return false;
    }
    
    return true;
  });
  
  // Log the libraries we found
  if (Object.keys(foundLibraries).length > 0) {
    console.log("Found Bitcoin libraries:", foundLibraries);
  }
  
  // NOTE: We're NOT creating mock Bitcoin library here anymore
  // We'll only create mocks in the dedicated mock-libs.ts file
  
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
