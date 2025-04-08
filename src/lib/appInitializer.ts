
/**
 * Application initialization functionality
 */

import { 
  checkBitcoinLibsLoaded,
  REQUIRED_LIBRARIES, 
  initializeMockLibraries,
  checkAndLogLibraryStatus,
  refreshLibraryReferences
} from './crypto/bitcoin-libs';
import { toast } from 'sonner';

/**
 * Load a script dynamically with fallback options
 * @param urls Array of URLs to try loading the script from
 * @param name Library name for reporting
 * @returns Promise that resolves when script loads or rejects on failure
 */
const loadScript = (urls: string[], name: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Try each URL in sequence
    const tryNextUrl = (index: number) => {
      if (index >= urls.length) {
        reject(new Error(`Failed to load ${name} from all sources`));
        return;
      }
      
      const script = document.createElement('script');
      script.src = urls[index];
      script.async = true;
      
      script.onload = () => {
        console.log(`${name} loaded successfully from ${urls[index]}`);
        resolve();
      };
      
      script.onerror = () => {
        console.error(`Failed to load ${name} from ${urls[index]}`);
        // Try next URL
        tryNextUrl(index + 1);
      };
      
      document.head.appendChild(script);
    };
    
    // Start with the first URL
    tryNextUrl(0);
  });
};

/**
 * Try to dynamically import a module with better error handling
 * @param moduleName Name of the module to import
 * @returns Promise that resolves with the imported module
 */
const tryDynamicImport = async (moduleName: string): Promise<any> => {
  try {
    // Check if already loaded in window
    const globalName = moduleName.replace(/-/g, '');
    if (window[globalName as keyof Window]) {
      console.log(`${moduleName} already loaded in window`);
      return window[globalName as keyof Window];
    }
    
    // Try dynamic import first
    try {
      console.log(`Trying dynamic import for ${moduleName}`);
      switch (moduleName) {
        case 'bs58':
          const bs58Module = await import('bs58');
          window.bs58 = bs58Module.default || bs58Module;
          return bs58Module;
        
        case 'bip39':
          const bip39Module = await import('bip39');
          window.bip39 = bip39Module.default || bip39Module;
          return bip39Module;
          
        case 'bech32':
          const bech32Module = await import('bech32');
          window.bech32 = bech32Module.default || bech32Module;
          return bech32Module;
          
        case 'secp256k1':
          const secp256k1Module = await import('@noble/secp256k1');
          window.secp256k1 = window.nobleSecp256k1 = window.secp = secp256k1Module;
          return secp256k1Module;
          
        case 'bitcoinjs-lib':
          const bitcoinModule = await import('bitcoinjs-lib');
          window.Bitcoin = window.bitcoin = window.bitcoinjs = bitcoinModule.default || bitcoinModule;
          return bitcoinModule;
          
        default:
          throw new Error(`No dynamic import handler for ${moduleName}`);
      }
    } catch (importError) {
      console.warn(`Dynamic import failed for ${moduleName}:`, importError);
      
      // Fall back to script loading
      const cdnUrls = [
        `https://esm.sh/${moduleName}`,
        `https://unpkg.com/${moduleName}`,
        `https://cdn.jsdelivr.net/npm/${moduleName}`
      ];
      
      await loadScript(cdnUrls, moduleName);
      console.log(`Loaded ${moduleName} via script tag`);
      
      // Check if it's now available in the window
      if (window[globalName as keyof Window]) {
        return window[globalName as keyof Window];
      }
      
      throw new Error(`${moduleName} not found in window after script loading`);
    }
  } catch (error) {
    console.error(`Failed to load ${moduleName}:`, error);
    throw error;
  }
};

/**
 * Initialize the Bitcoin libraries
 * This function should be called before using any Bitcoin cryptography functionality
 */
export const initializeLibraries = async (): Promise<boolean> => {
  console.info("Initializing Bitcoin libraries...");
  
  // Map any library aliases that might exist already
  refreshLibraryReferences();
  
  // Give time for ES modules to load
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check library status and log
  const libsCheck = checkAndLogLibraryStatus();
  
  if (!libsCheck) {
    console.error(`Bitcoin libraries not loaded: Missing ${checkBitcoinLibsLoaded().missing.join(', ')}`);
    
    // Wait a bit longer and try again
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Refresh the references
    refreshLibraryReferences();
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
