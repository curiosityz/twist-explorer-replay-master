
/**
 * Application initialization functions
 */
import { toast } from 'sonner';
import { 
  checkBitcoinLibsLoaded,
  initializeMockLibraries 
} from './crypto/bitcoin-libs';
import { checkAndLogLibraryStatus } from './crypto/bitcoin-libs/logging';
import { refreshLibraryReferences } from './crypto/bitcoin-libs'; 
import { mapLibraryAliases } from './crypto/bitcoinUtilities';

// Wait for a specific duration
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Load libraries dynamically with retry capability
 * @param libraryName Name of the library to load
 * @param url URL to load the library from
 * @param fallbackUrl Optional fallback URL if the primary fails
 */
export const loadScript = (libraryName: string, url: string, fallbackUrl?: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;

    script.onload = () => {
      console.log(`${libraryName} loaded successfully from ${url}`);
      resolve();
    };

    script.onerror = async (e) => {
      console.error(`Failed to load ${libraryName} library`, e);
      
      if (fallbackUrl) {
        console.log(`Trying fallback URL for ${libraryName}`);
        try {
          const fallbackScript = document.createElement('script');
          fallbackScript.src = fallbackUrl;
          fallbackScript.async = true;
          
          fallbackScript.onload = () => {
            console.log(`${libraryName} loaded successfully from fallback URL`);
            resolve();
          };
          
          fallbackScript.onerror = () => {
            console.error(`Failed to load ${libraryName} from fallback URL as well`);
            reject(new Error(`Could not load ${libraryName}`));
          };
          
          document.body.appendChild(fallbackScript);
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      } else {
        reject(new Error(`Failed to load ${libraryName}`));
      }
    };

    document.body.appendChild(script);
  });
};

/**
 * Try to dynamically import a module, with fallback to script loading
 */
export const tryDynamicImport = async (
  libraryName: string, 
  importPath: string, 
  scriptUrl?: string,
  fallbackUrl?: string
): Promise<boolean> => {
  try {
    const module = await import(importPath);
    window[libraryName as keyof Window] = module.default || module;
    console.log(`Loaded ${libraryName} via dynamic import`);
    return true;
  } catch (e) {
    console.warn(`Dynamic import failed for ${libraryName}, trying script tag approach`);
    if (scriptUrl) {
      try {
        await loadScript(libraryName, scriptUrl, fallbackUrl);
        return true;
      } catch (scriptError) {
        console.error(`Failed to load ${libraryName} via script tag:`, scriptError);
        return false;
      }
    }
    return false;
  }
};

/**
 * Initialize all required cryptographic libraries
 */
export const initializeLibraries = async (): Promise<void> => {
  // First check if libraries are already loaded
  checkAndLogLibraryStatus();
  
  // Get the status of available libraries
  const libStatus = checkBitcoinLibsLoaded();
  
  if (!libStatus.loaded) {
    console.error(`Bitcoin libraries not loaded: Missing ${libStatus.missing.join(', ')}`);
    
    // Try refreshing references to ensure all available libraries are mapped properly
    refreshLibraryReferences();
    mapLibraryAliases(window);
    
    // Second check after refreshing references
    const updatedStatus = checkBitcoinLibsLoaded();
    checkAndLogLibraryStatus();
    
    if (!updatedStatus.loaded) {
      console.warn("Creating mock implementations for missing libraries");
      // Initialize mock implementations for testing and development
      initializeMockLibraries();
    }
  }
  
  // Final check of library status
  const finalStatus = checkBitcoinLibsLoaded();
  if (!finalStatus.loaded) {
    console.warn("Some Bitcoin libraries could not be loaded. Limited functionality available.");
    toast.warning("Crypto libraries not fully loaded. Some features may be limited.");
  } else {
    console.log("All Bitcoin libraries successfully loaded");
  }
};

/**
 * Initialize the application
 */
export const initializeApplication = async (): Promise<void> => {
  try {
    await initializeLibraries();
    console.log("Application initialized successfully");
    
    // Add a delay to ensure all initialization is complete before React hydration
    await wait(1000);
  } catch (error) {
    console.error("Failed to initialize application:", error);
    toast.error("Failed to initialize application. Please refresh the page.");
  }
};
