
/**
 * Bitcoin library initialization and status checking
 */
import { checkAndLogLibraryStatus, checkBitcoinLibsLoaded } from './bitcoinLibsCheck';

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

/**
 * Check if required libraries for a specific operation are available
 * @param requiredLibs Array of specific library names needed
 * @returns Object with status and any missing libraries from the required set
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
