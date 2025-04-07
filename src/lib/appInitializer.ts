
/**
 * Application initialization utilities
 */

import { checkAndLogLibraryStatus, checkBitcoinLibsLoaded } from './crypto/bitcoinLibsCheck';
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
    if (!window.Bitcoin && (window.bitcoin || window.bitcoinjs)) {
      window.Bitcoin = window.bitcoin || window.bitcoinjs;
      console.log("Mapped alternative Bitcoin library name to window.Bitcoin");
    }
    
    // Directly try to access elements from the DOM
    try {
      // Make sure the required libraries are loaded from CDN scripts
      const checkLibs = () => {
        // Force refresh of all library references
        if (typeof window.bs58 === 'undefined' && typeof window['bs58' as any] !== 'undefined') {
          window.bs58 = (window as any).bs58;
          console.log("Mapped global bs58 to window.bs58");
        }
        
        if (typeof window.bip39 === 'undefined' && typeof window['bip39' as any] !== 'undefined') {
          window.bip39 = (window as any).bip39;
          console.log("Mapped global bip39 to window.bip39");
        }
        
        if (typeof window.bech32 === 'undefined' && typeof window['bech32' as any] !== 'undefined') {
          window.bech32 = (window as any).bech32;
          console.log("Mapped global bech32 to window.bech32");
        }
        
        if (typeof window.bitcoinMessage === 'undefined' && typeof window['bitcoinMessage' as any] !== 'undefined') {
          window.bitcoinMessage = (window as any).bitcoinMessage;
          console.log("Mapped global bitcoinMessage to window.bitcoinMessage");
        }
        
        if (typeof window.bitcoinAddressValidation === 'undefined' && typeof window['validate' as any] !== 'undefined') {
          window.bitcoinAddressValidation = (window as any).validate;
          console.log("Mapped global validate to window.bitcoinAddressValidation");
        }
        
        if (typeof window.Bitcoin === 'undefined') {
          if (typeof window['bitcoin' as any] !== 'undefined') {
            window.Bitcoin = (window as any).bitcoin;
            console.log("Mapped global bitcoin to window.Bitcoin");
          } else if (typeof window['bitcoinjs' as any] !== 'undefined') {
            window.Bitcoin = (window as any).bitcoinjs;
            console.log("Mapped global bitcoinjs to window.Bitcoin");
          } else if (typeof window['BitcoinLib' as any] !== 'undefined') {
            window.Bitcoin = (window as any).BitcoinLib;
            console.log("Mapped global BitcoinLib to window.Bitcoin");
          }
        }
      };
      
      // Run immediately
      checkLibs();
      
      // Wait short time and check again in case of race conditions 
      setTimeout(checkLibs, 500);
    } catch (e) {
      console.error("Error mapping global libraries:", e);
    }
    
    // Log detailed status of all libraries
    checkAndLogLibraryStatus();
    
    // Get final library status
    const bitcoinLibStatus = checkBitcoinLibsLoaded();
    
    if (!bitcoinLibStatus.loaded) {
      console.error(`Bitcoin libraries not loaded: Missing ${bitcoinLibStatus.missing.join(', ')}`);
      toast(`Some Bitcoin libraries not detected: ${bitcoinLibStatus.missing.join(', ')}. Some features may not work correctly.`, {
        duration: 10000, 
        className: "bg-red-100"
      });
      
      // Force window refresh of library references
      refreshLibraryReferences();
      
      // Set up a retry mechanism
      console.log("Will retry library initialization in 2 seconds...");
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
      const retrySuccess = initializeLibraries();
      
      if (!retrySuccess) {
        // Final attempt with direct dynamic loading
        loadLibrariesDynamically();
      }
    }, 2000);
  }
  
  console.log("Application initialization completed");
};

/**
 * Last-resort dynamic loading of libraries
 */
const loadLibrariesDynamically = (): void => {
  console.log("Attempting to dynamically load missing libraries...");
  
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
  
  // Try to load libraries that are missing
  const bitcoinLibStatus = checkBitcoinLibsLoaded();
  
  // Dynamically load libraries if needed
  const loadPromises = [];
  
  if (bitcoinLibStatus.missing.includes('bs58')) {
    loadPromises.push(createScript('https://cdn.jsdelivr.net/npm/bs58@5.0.0/dist/bs58.bundle.min.js', 'bs58'));
  }
  
  if (bitcoinLibStatus.missing.includes('bip39')) {
    loadPromises.push(createScript('https://cdn.jsdelivr.net/npm/bip39@3.1.0/dist/index.min.js', 'bip39'));
  }
  
  if (bitcoinLibStatus.missing.includes('bech32')) {
    loadPromises.push(createScript('https://cdn.jsdelivr.net/npm/bech32@2.0.0/dist/index.min.js', 'bech32'));
  }
  
  if (bitcoinLibStatus.missing.includes('bitcoinMessage')) {
    loadPromises.push(createScript('https://cdn.jsdelivr.net/npm/bitcoinjs-message@2.2.0/index.min.js', 'bitcoinMessage'));
  }
  
  if (bitcoinLibStatus.missing.includes('bitcoinAddressValidation')) {
    loadPromises.push(createScript('https://cdn.jsdelivr.net/npm/bitcoin-address-validation@3.0.0/dist/index.min.js', 'bitcoinAddressValidation'));
  }
  
  // Try one more Bitcoin library source as a fallback
  if (bitcoinLibStatus.missing.includes('Bitcoin')) {
    loadPromises.push(createScript('https://cdn.jsdelivr.net/npm/bitcoinjs-lib@6.1.3/dist/bitcoin-lib.js', 'Bitcoin'));
  }
  
  // When all scripts are loaded, check status again
  Promise.allSettled(loadPromises).then(() => {
    setTimeout(() => {
      // Check if we have all libraries now
      const finalStatus = checkBitcoinLibsLoaded();
      if (finalStatus.loaded) {
        console.log("Successfully loaded all required libraries dynamically");
        toast("Successfully loaded all required libraries", { duration: 3000 });
      } else {
        console.error(`Still missing libraries after dynamic loading: ${finalStatus.missing.join(', ')}`);
        toast(`Some features may not work due to missing libraries: ${finalStatus.missing.join(', ')}`, {
          duration: 10000,
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

/**
 * Attempt to refresh references to libraries that might have loaded later
 */
const refreshLibraryReferences = (): void => {
  // Try to assign noble-secp256k1 to secp256k1 if it loaded later
  if (!window.secp256k1) {
    if (window.nobleSecp256k1) {
      window.secp256k1 = window.nobleSecp256k1;
      console.log("Refreshed secp256k1 reference from nobleSecp256k1");
    } else if (window.secp) {
      window.secp256k1 = window.secp;
      console.log("Refreshed secp256k1 reference from secp");
    }
  }
  
  // Check for Bitcoin global object and try to find it from different sources
  if (!window.Bitcoin) {
    if (typeof window.bitcoin !== 'undefined') {
      window.Bitcoin = window.bitcoin;
      console.log("Refreshed Bitcoin reference from window.bitcoin");
    } else if (typeof window.bitcoinjs !== 'undefined') {
      window.Bitcoin = window.bitcoinjs;
      console.log("Refreshed Bitcoin reference from window.bitcoinjs");
    }
  }
  
  // Log updated status
  console.log("Library references refreshed. Current status:");
  console.log("- Bitcoin:", typeof window.Bitcoin !== 'undefined' ? "Available" : "Missing");
  console.log("- secp256k1:", typeof window.secp256k1 !== 'undefined' ? "Available" : "Missing");
};
