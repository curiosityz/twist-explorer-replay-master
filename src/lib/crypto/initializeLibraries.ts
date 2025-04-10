
/**
 * Bitcoin library initialization and status checking
 */
import { 
  checkAndLogLibraryStatus, 
  checkBitcoinLibsLoaded, 
  refreshLibraryReferences,
  initializeMockLibraries
} from './bitcoin-libs';

/**
 * Initialize Bitcoin libraries and check loading status
 * This should be called early in your application startup
 * @returns Object with status and any missing libraries
 */
export const initializeBitcoinLibraries = (): { loaded: boolean; missing: string[] } => {
  console.log("Initializing Bitcoin libraries...");
  
  // First, try to refresh references to already loaded libraries
  refreshLibraryReferences();
  
  // Check if libraries were loaded properly
  const libStatus = checkBitcoinLibsLoaded();
  
  // Check for ESM loaded libraries that might be available but not properly mapped
  const esmLibraries = (window as any).esmLibraries || {};
  const realLibrariesAvailable = Object.keys(esmLibraries).length > 0;
  
  if (realLibrariesAvailable) {
    console.log("ESM libraries detected:", Object.keys(esmLibraries));
    // Map ESM libraries to global window objects if they're not already there
    Object.entries(esmLibraries).forEach(([name, lib]) => {
      if (!window[name as keyof Window]) {
        console.log(`Mapping ESM library ${name} to window.${name}`);
        (window as any)[name] = lib;
      }
    });
    
    // Check library status again after mapping ESM libraries
    const updatedStatus = checkBitcoinLibsLoaded();
    if (updatedStatus.loaded) {
      console.log("Successfully mapped ESM libraries to window");
      return updatedStatus;
    }
  }
  
  // If libraries are missing, initialize mock versions for fallback support
  if (!libStatus.loaded) {
    console.warn(`Some Bitcoin libraries not loaded: ${libStatus.missing.join(', ')}`);
    console.info("Creating fallback implementations...");
    initializeMockLibraries();
    
    // Check the status again after initializing mocks
    const updatedStatus = checkBitcoinLibsLoaded();
    if (!updatedStatus.loaded) {
      console.error("Failed to initialize all required libraries even with fallbacks");
    } else {
      console.info("Mock libraries initialized successfully");
    }
    
    return updatedStatus;
  }
  
  // Log the successful initialization
  console.log("Bitcoin libraries initialized successfully");
  return libStatus;
};

// Re-export utility functions for compatibility
export { refreshLibraryReferences, initializeMockLibraries };
