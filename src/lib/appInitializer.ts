
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
  
  // Check library status and log
  const libsCheck = checkAndLogLibraryStatus();
  
  if (!libsCheck) {
    console.error(`Bitcoin libraries not loaded: Missing ${checkBitcoinLibsLoaded().missing.join(', ')}`);
    
    // Create fallback references for missing critical libraries
    await tryDynamicImport();
    
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
 * Try to dynamically import missing libraries
 */
const tryDynamicImport = async (): Promise<void> => {
  const missingLibs = checkBitcoinLibsLoaded().missing;
  if (missingLibs.length === 0) return;
  
  console.info(`Attempting to dynamically load missing libraries: ${missingLibs.join(', ')}...`);
  
  const loadPromises = [];
  
  // Helper function to dynamically load a script
  const loadScript = (src: string, libName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => {
        console.info(`Dynamically loaded ${libName} library`);
        resolve();
      };
      script.onerror = (err) => {
        console.error(`Failed to load ${libName} library`, err);
        reject(err);
      };
      document.head.appendChild(script);
    });
  };
  
  // Try to load missing libraries
  for (const lib of missingLibs) {
    switch (lib) {
      case 'bs58':
        loadPromises.push(loadScript('https://cdn.jsdelivr.net/npm/bs58@5.0.0/dist/bs58.bundle.min.js', 'bs58'));
        break;
      case 'bip39':
        loadPromises.push(loadScript('https://cdn.jsdelivr.net/npm/bip39@3.1.0/dist/index.min.js', 'bip39'));
        break;
      case 'bech32':
        loadPromises.push(loadScript('https://cdn.jsdelivr.net/npm/bech32@2.0.0/dist/index.min.js', 'bech32'));
        break;
      case 'bitcoinMessage':
        loadPromises.push(loadScript('https://cdn.jsdelivr.net/npm/bitcoinjs-message@2.2.0/index.min.js', 'bitcoinMessage'));
        break;
      case 'bitcoinAddressValidation':
        loadPromises.push(loadScript('https://cdn.jsdelivr.net/npm/bitcoin-address-validation@3.0.0/dist/index.min.js', 'bitcoinAddressValidation'));
        break;
      case 'secp256k1':
        if (!window.secp256k1) {
          loadPromises.push(
            loadScript('https://cdn.jsdelivr.net/npm/@noble/secp256k1@2.0.0/lib/index.browser.js', 'secp256k1')
          );
        }
        break;
      case 'Bitcoin':
        if (!window.Bitcoin) {
          loadPromises.push(
            loadScript('https://cdn.jsdelivr.net/npm/bitcoinjs-lib@6.1.3/dist/bitcoin-lib.js', 'Bitcoin')
          );
        }
        break;
    }
  }
  
  try {
    await Promise.allSettled(loadPromises);
  } catch (error) {
    console.error("Error dynamically loading libraries:", error);
  }
  
  // Wait a moment for scripts to initialize
  await new Promise(resolve => setTimeout(resolve, 200));
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
