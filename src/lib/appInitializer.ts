
/**
 * Application initialization utilities
 */

import { checkAndLogLibraryStatus, checkBitcoinLibsLoaded } from './crypto/bitcoinLibsCheck';
import { toast } from 'sonner';

/**
 * Initialize the application and required libraries
 * Should be called early in the application lifecycle
 */
export const initializeApplication = (): void => {
  console.log("Initializing application...");
  
  // Try dynamic import of @noble/secp256k1 if needed
  if (!window.secp256k1 && !window.secp && !window.nobleSecp256k1) {
    try {
      // @ts-ignore - Dynamic import
      import('@noble/secp256k1').then(module => {
        window.secp256k1 = module;
        console.log("Dynamically imported @noble/secp256k1");
      }).catch(err => {
        console.error("Failed to dynamically import @noble/secp256k1:", err);
      });
    } catch (error) {
      console.warn("Dynamic import not supported:", error);
    }
  }
  
  // Wait a brief moment to ensure DOM content is loaded and libraries are initialized
  setTimeout(() => {
    console.log("Initializing Bitcoin libraries...");
    
    // First check if alternate library names are available and map them
    if (!window.Bitcoin && (window.bitcoin || window.bitcoinjs)) {
      window.Bitcoin = window.bitcoin || window.bitcoinjs;
      console.log("Mapped alternative Bitcoin library name to window.Bitcoin");
    }
    
    if (!window.secp256k1) {
      if (window.nobleSecp256k1) {
        window.secp256k1 = window.nobleSecp256k1;
        console.log("Mapped nobleSecp256k1 to window.secp256k1");
      } else if (window.secp) {
        window.secp256k1 = window.secp;
        console.log("Mapped secp to window.secp256k1");
      }
    }
    
    // Log detailed status of all libraries
    checkAndLogLibraryStatus();
    
    // Get final library status
    const bitcoinLibStatus = checkBitcoinLibsLoaded();
    
    if (!bitcoinLibStatus.loaded) {
      console.error(`Bitcoin libraries not loaded: Missing ${bitcoinLibStatus.missing.join(', ')}`);
      toast(`Some Bitcoin libraries not detected: ${bitcoinLibStatus.missing.join(', ')}. Some features may not work correctly.`);
      
      // Force window refresh of library references
      refreshLibraryReferences();
    } else {
      console.log("All Bitcoin libraries loaded successfully");
      toast("All required libraries loaded successfully");
    }
    
    // Initialize any other application components here
    
    console.log("Application initialization completed");
  }, 2000); // Increased delay to ensure libraries have time to initialize
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
    toast(`${feature} unavailable: Missing required libraries: ${missing.join(', ')}`);
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
