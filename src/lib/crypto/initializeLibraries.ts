
/**
 * Bitcoin library initialization and status checking
 */
import { 
  checkAndLogLibraryStatus, 
  checkBitcoinLibsLoaded, 
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
  
  // Log the status of library loading
  checkAndLogLibraryStatus();
  
  // Return the current status
  return checkBitcoinLibsLoaded();
};

// Re-export utility functions for compatibility
export { checkRequiredLibraries, handleMissingLibraries };
