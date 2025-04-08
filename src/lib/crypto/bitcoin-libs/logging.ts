
/**
 * Logging functionality for Bitcoin libraries
 */

import { REQUIRED_LIBRARIES, LIBRARY_ALIASES } from './types';

/**
 * Check and log the status of each Bitcoin library
 * @returns Boolean indicating if all required libraries are loaded
 */
export const checkAndLogLibraryStatus = (): boolean => {
  console.info("Checking Bitcoin libraries status...");
  
  // For logging which library variants we actually found
  const foundLibraries: Record<string, string> = {};
  
  // Check each library
  const missing = REQUIRED_LIBRARIES.filter(lib => {
    // Direct check for the primary library name
    if ((window as any)[lib]) {
      foundLibraries[lib] = lib;
      return false;
    }
    
    // Check for alternate global names
    const aliases = LIBRARY_ALIASES[lib] || [];
    for (const alias of aliases) {
      if ((window as any)[alias]) {
        // If found by alias, assign to main name if not already present
        if (!(window as any)[lib]) {
          (window as any)[lib] = (window as any)[alias];
        }
        foundLibraries[lib] = alias;
        return false;
      }
    }
    
    return true;
  });
  
  // Log found libraries
  console.info("Found Bitcoin libraries:", foundLibraries);
  
  // Log status for each library
  REQUIRED_LIBRARIES.forEach(lib => {
    const loaded = !!foundLibraries[lib];
    console.info(`- ${lib}: ${loaded ? 'Loaded' : 'Not loaded'}`);
  });
  
  const allLoaded = missing.length === 0;
  if (allLoaded) {
    console.info("All Bitcoin libraries loaded successfully");
  } else {
    console.error(`Bitcoin libraries not loaded: Missing ${missing.join(', ')}`);
  }
  
  return allLoaded;
};
