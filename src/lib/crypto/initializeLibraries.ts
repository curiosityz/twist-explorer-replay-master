
/**
 * Bitcoin library initialization and status checking
 */
import { 
  checkAndLogLibraryStatus, 
  checkBitcoinLibsLoaded, 
  refreshLibraryReferences,
  initializeMockLibraries,
  checkRequiredLibraries,
  handleMissingLibraries
} from './bitcoin-libs';

/**
 * Initialize Bitcoin libraries and check loading status
 * This should be called early in your application startup
 * @returns Object with status and any missing libraries
 */
export const initializeBitcoinLibraries = (): { loaded: boolean; missing: string[] } => {
  console.log("Initializing Bitcoin libraries...");
  
  // Check if we have real libraries loaded via ESM
  const realLibraries = (window as any).esmLibraries || {};
  const realLibrariesAvailable = Object.keys(realLibraries).length > 0;
  
  if (realLibrariesAvailable) {
    console.log("Real libraries detected:", Object.keys(realLibraries));
    
    // Map real ESM libraries to global window objects
    Object.entries(realLibraries).forEach(([name, lib]) => {
      if (!window[name as keyof Window]) {
        console.log(`Mapping real ESM library ${name} to window.${name}`);
        (window as any)[name] = lib;
      }
    });
  }
  
  // Refresh references to already loaded libraries
  refreshLibraryReferences();
  
  // Check if libraries were loaded properly
  const libStatus = checkBitcoinLibsLoaded();
  
  // If libraries are missing, check if we need to map any name variants
  if (!libStatus.loaded) {
    // Map library name variants
    if (!window.secp256k1 && (window as any).nobleSecp256k1) {
      console.log("Mapping noble-secp256k1 to window.secp256k1");
      (window as any).secp256k1 = (window as any).nobleSecp256k1;
    }
    
    // Check for libraries in common alternative locations
    const missingLibs = checkRequiredLibraries();
    if (missingLibs.length > 0) {
      console.warn(`Missing libraries: ${missingLibs.join(', ')}`);
      handleMissingLibraries(missingLibs);
    }
    
    // Check again after handling missing libraries
    const updatedStatus = checkBitcoinLibsLoaded();
    
    if (!updatedStatus.loaded) {
      console.error("Failed to initialize all required libraries even with fallbacks");
    } else {
      console.info("Libraries initialized successfully");
    }
    
    return updatedStatus;
  }
  
  // Log the successful initialization
  console.log("Bitcoin libraries initialized successfully");
  return libStatus;
};

// Re-export utility functions for compatibility
export { refreshLibraryReferences, initializeMockLibraries };
