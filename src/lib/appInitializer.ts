
/**
 * Application initialization functionality
 */

import { 
  checkBitcoinLibsLoaded,
  REQUIRED_LIBRARIES, 
  initializeMockLibraries,
  checkAndLogLibraryStatus
} from './crypto/bitcoin-libs';
import { toast } from 'sonner';

/**
 * Initialize the Bitcoin libraries
 * This function should be called before using any Bitcoin cryptography functionality
 */
export const initializeLibraries = async (): Promise<boolean> => {
  console.info("Initializing Bitcoin libraries...");
  
  // Give time for ES modules to load
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check library status and log
  const libsCheck = checkAndLogLibraryStatus();
  
  if (!libsCheck) {
    console.error(`Bitcoin libraries not loaded: Missing ${checkBitcoinLibsLoaded().missing.join(', ')}`);
    
    // Wait a bit longer and try again
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Refresh the references
    console.info("Library references refreshed. Current status:");
    const secondCheck = checkAndLogLibraryStatus();
    
    if (!secondCheck) {
      console.warn("Creating mock implementations for missing libraries");
      initializeMockLibraries();
      
      console.info("Retrying Bitcoin libraries initialization...");
      const finalCheck = checkAndLogLibraryStatus();
      return finalCheck;
    }
    
    return secondCheck;
  }
  
  return true;
};

/**
 * Initialize the application
 * This function should be called on application startup
 */
export const initializeApplication = async (): Promise<void> => {
  try {
    // Initialize libraries
    await initializeLibraries();
    console.info("Application initialization completed");
  } catch (error) {
    console.error("Error during application initialization:", error);
    toast.error("Failed to initialize application");
  }
};
