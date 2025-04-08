
/**
 * Application initialization utilities
 */

import { checkAndLogLibraryStatus, checkBitcoinLibsLoaded, mapLibraryAliases, refreshLibraryReferences } from './crypto/bitcoin-libs';
import { toast } from 'sonner';
// Import the library directly so it's bundled with the application
import * as secp256k1 from '@noble/secp256k1';

/**
 * Initialize the application and required libraries
 * Should be called early in the application lifecycle
 */
export const initializeApplication = (): void => {
  console.log("Initializing application...");
  
  // Make secp256k1 available globally - ALWAYS set this up first
  try {
    // Use the imported library and ensure it's properly assigned
    window.secp256k1 = secp256k1;
    window.nobleSecp256k1 = secp256k1;
    window.secp = secp256k1;
    console.log("Made @noble/secp256k1 globally available via multiple references");
  } catch (error) {
    console.error("Failed to set up secp256k1:", error);
  }
  
  // Set up a proper initialization sequence with retry mechanism
  const initializeLibraries = () => {
    console.log("Initializing Bitcoin libraries...");
    
    // First check if alternate library names are available and map them
    mapLibraryAliases();
    
    // Check library status after mapping
    checkAndLogLibraryStatus();
    
    // Get current library status
    const bitcoinLibStatus = checkBitcoinLibsLoaded();
    
    if (!bitcoinLibStatus.loaded) {
      console.error(`Bitcoin libraries not loaded: Missing ${bitcoinLibStatus.missing.join(', ')}`);
      toast(`Some Bitcoin libraries not detected: ${bitcoinLibStatus.missing.join(', ')}. Loading dynamically...`, {
        duration: 5000
      });
      
      // Force window refresh of library references
      refreshLibraryReferences();
      
      // Load missing libraries dynamically right away
      loadLibrariesDynamically(bitcoinLibStatus.missing);
      
      return false; // Not fully loaded
    } else {
      console.log("All Bitcoin libraries loaded successfully");
      toast("All required libraries loaded successfully", {
        duration: 3000
      });
      return true; // Successfully loaded
    }
  };
  
  // First attempt at initialization
  const initialSuccess = initializeLibraries();
  
  // If not successful, try again after a delay
  if (!initialSuccess) {
    setTimeout(() => {
      console.log("Retrying Bitcoin libraries initialization...");
      initializeLibraries();
    }, 1500);
  }
  
  console.log("Application initialization completed");
};

/**
 * Dynamic loading of libraries
 */
const loadLibrariesDynamically = (missingLibs: string[]): void => {
  console.log(`Attempting to dynamically load missing libraries: ${missingLibs.join(', ')}...`);
  
  const createScript = (src: string, globalName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => {
        console.log(`Dynamically loaded ${globalName} library`);
        resolve();
      };
      script.onerror = () => {
        console.error(`Failed to load ${globalName} library`);
        reject();
      };
      document.head.appendChild(script);
    });
  };
  
  // Dynamically load libraries if needed
  const loadPromises = [];
  
  if (missingLibs.includes('bs58')) {
    loadPromises.push(createScript('https://cdn.jsdelivr.net/npm/bs58@5.0.0/dist/bs58.bundle.min.js', 'bs58')
      .then(() => {
        if (window['bs58']) {
          (window as any).bs58 = window['bs58'];
          console.log("Successfully loaded bs58");
        }
      }));
  }
  
  if (missingLibs.includes('bip39')) {
    loadPromises.push(createScript('https://cdn.jsdelivr.net/npm/bip39@3.1.0/dist/index.min.js', 'bip39')
      .then(() => {
        if (window['bip39']) {
          (window as any).bip39 = window['bip39'];
          console.log("Successfully loaded bip39");
        }
      }));
  }
  
  if (missingLibs.includes('bech32')) {
    loadPromises.push(createScript('https://cdn.jsdelivr.net/npm/bech32@2.0.0/dist/index.min.js', 'bech32')
      .then(() => {
        if (window['bech32']) {
          (window as any).bech32 = window['bech32'];
          console.log("Successfully loaded bech32");
        }
      }));
  }
  
  if (missingLibs.includes('bitcoinMessage')) {
    loadPromises.push(createScript('https://cdn.jsdelivr.net/npm/bitcoinjs-message@2.2.0/index.min.js', 'bitcoinMessage')
      .then(() => {
        if (window['bitcoinMessage']) {
          (window as any).bitcoinMessage = window['bitcoinMessage'];
          console.log("Successfully loaded bitcoinMessage");
        }
      }));
  }
  
  if (missingLibs.includes('bitcoinAddressValidation')) {
    loadPromises.push(createScript('https://cdn.jsdelivr.net/npm/bitcoin-address-validation@3.0.0/dist/index.min.js', 'bitcoinAddressValidation')
      .then(() => {
        if (window['validate']) {
          (window as any).bitcoinAddressValidation = window['validate'];
          console.log("Successfully loaded bitcoinAddressValidation");
        }
      }));
  }
  
  // Try one more Bitcoin library source as a fallback
  if (missingLibs.includes('Bitcoin')) {
    loadPromises.push(createScript('https://cdn.jsdelivr.net/npm/bitcoinjs-lib@6.1.3/dist/bitcoin-lib.js', 'Bitcoin')
      .then(() => {
        if (window['bitcoin'] || window['Bitcoin'] || window['bitcoinjs']) {
          (window as any).Bitcoin = window['Bitcoin'] || window['bitcoin'] || window['bitcoinjs'];
          console.log("Successfully loaded Bitcoin library");
        }
      }));
  }
  
  // When all scripts are loaded, check status again
  Promise.allSettled(loadPromises).then(() => {
    setTimeout(() => {
      // Update library mappings
      mapLibraryAliases();
      
      // Check if we have all libraries now
      const finalStatus = checkBitcoinLibsLoaded();
      if (finalStatus.loaded) {
        console.log("Successfully loaded all required libraries dynamically");
        toast("Successfully loaded all required libraries", { duration: 3000 });
      } else {
        console.error(`Still missing libraries after dynamic loading: ${finalStatus.missing.join(', ')}`);
        toast(`Some libraries could not be loaded: ${finalStatus.missing.join(', ')}. Some features may not work.`, {
          duration: 5000,
          className: "bg-red-100"
        });
      }
    }, 1000); // Wait a bit for libraries to initialize
  });
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
    toast(`${feature} unavailable: Missing required libraries: ${missing.join(', ')}`, {
      className: "bg-red-100"
    });
    return false;
  }
  
  return true;
};
