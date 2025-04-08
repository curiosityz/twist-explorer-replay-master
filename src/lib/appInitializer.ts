/**
 * Initialize application dependencies
 */

import { initializeBitcoinLibraries } from './crypto/initializeLibraries';

/**
 * Initialize all required libraries and dependencies for the application
 * @returns Promise that resolves when all libraries are loaded
 */
export async function initializeApplication(): Promise<void> {
  try {
    console.log("Initializing application...");
    
    // Initialize Bitcoin libraries
    const libStatus = initializeBitcoinLibraries();
    if (!libStatus.loaded) {
      console.warn(`Bitcoin libraries not loaded: Missing ${libStatus.missing.join(', ')}`);
      // Libraries will be loaded on-demand or lazily later
    }
    
    // Initialize database connection if needed
    // await initializeDatabase();
    
    console.log("Application initialization complete");
  } catch (error) {
    console.error("Failed to initialize application:", error);
    throw error;
  }
}
