
/**
 * Initialize application dependencies
 */

import { initializeBitcoinLibraries, refreshLibraryReferences } from './crypto/initializeLibraries';
import { toast } from 'sonner';

/**
 * Initialize all required libraries and dependencies for the application
 * @returns Promise that resolves when all libraries are loaded
 */
export async function initializeApplication(): Promise<void> {
  try {
    console.log("Initializing application...");
    
    // Initialize Bitcoin libraries with a retry mechanism
    const initializeLibs = async (retries = 2): Promise<boolean> => {
      // Try to load libraries
      const libStatus = initializeBitcoinLibraries();
      
      if (libStatus.loaded) {
        console.log("All Bitcoin libraries loaded successfully");
        return true;
      }
      
      // If not loaded and we have retries left, wait and try again
      if (retries > 0) {
        console.warn(`Retrying library initialization (${retries} attempts left)...`);
        // Wait a bit for potential dynamic imports to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Try to refresh references again before retrying
        refreshLibraryReferences();
        return initializeLibs(retries - 1);
      }
      
      // If we're out of retries, warn the user but don't block the application
      console.error("Could not load all required libraries:", libStatus.missing);
      toast("Warning: Some crypto features may have limited functionality", {
        description: "Not all required libraries could be loaded",
        duration: 5000,
      });
      
      return false;
    };
    
    // Run the initialization
    await initializeLibs();
    
    // Initialize other application dependencies here if needed
    
    console.log("Application initialization complete");
  } catch (error) {
    console.error("Failed to initialize application:", error);
    toast.error("Application initialization failed", {
      description: "Some features may not work properly",
      duration: 5000,
    });
    // Don't throw the error to prevent app from crashing
  }
}
