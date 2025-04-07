
/**
 * Application initialization utilities
 */

import { initializeBitcoinLibraries, handleMissingLibraries } from './crypto/initializeLibraries';
import { toast } from 'sonner';

/**
 * Initialize the application and required libraries
 * Should be called early in the application lifecycle
 */
export const initializeApplication = (): void => {
  console.log("Initializing application...");
  
  // Wait a brief moment to ensure DOM content is loaded and libraries are initialized
  setTimeout(() => {
    // Initialize Bitcoin libraries
    const bitcoinLibStatus = initializeBitcoinLibraries();
    
    if (!bitcoinLibStatus.loaded) {
      console.error(`Bitcoin libraries not loaded: Missing ${bitcoinLibStatus.missing.join(', ')}`);
      toast.error(`Some Bitcoin libraries not detected: ${bitcoinLibStatus.missing.join(', ')}`, {
        description: "Some features may not work correctly. Please check your internet connection and refresh the page.",
        duration: 6000
      });
    } else {
      console.log("All Bitcoin libraries loaded successfully");
      toast.success("All required libraries loaded successfully", {
        duration: 3000
      });
    }
    
    // Initialize any other application components here
    
    console.log("Application initialization completed");
  }, 300); // Small delay to ensure libraries have time to initialize
};

/**
 * Check specific libraries required for a feature
 * @param feature Feature name for logging
 * @param requiredLibs Array of library names needed for the feature
 * @returns Boolean indicating if all required libraries are available
 */
export const checkFeatureLibraries = (feature: string, requiredLibs: string[]): boolean => {
  const missing = requiredLibs.filter(lib => !window[lib as keyof Window]);
  
  if (missing.length > 0) {
    const error = `${feature} requires libraries that are not loaded: ${missing.join(', ')}`;
    console.error(error);
    toast.error(`${feature} unavailable`, {
      description: `Missing required libraries: ${missing.join(', ')}`
    });
    return false;
  }
  
  return true;
};
