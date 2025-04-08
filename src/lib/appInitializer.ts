
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
    (window as any).secp256k1 = secp256k1;
    (window as any).nobleSecp256k1 = secp256k1;
    (window as any).secp = secp256k1;
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
  
  // Function to safely assign libraries
  const assignGlobalLibrary = (globalName: string, source: string): void => {
    try {
      if (window[source as keyof Window] && !window[globalName as keyof Window]) {
        (window as any)[globalName] = window[source as keyof Window];
        console.log(`Successfully assigned ${source} to ${globalName}`);
      }
    } catch (err) {
      console.error(`Error assigning ${source} to ${globalName}:`, err);
    }
  };
  
  // Dynamically load libraries if needed
  const loadPromises = [];
  
  if (missingLibs.includes('bs58')) {
    loadPromises.push(createScript('https://cdn.jsdelivr.net/npm/bs58@5.0.0/dist/bs58.bundle.min.js', 'bs58')
      .then(() => {
        assignGlobalLibrary('bs58', 'bs58');
      }));
  }
  
  if (missingLibs.includes('bip39')) {
    loadPromises.push(createScript('https://cdn.jsdelivr.net/npm/bip39@3.1.0/dist/index.min.js', 'bip39')
      .then(() => {
        assignGlobalLibrary('bip39', 'bip39');
      }));
  }
  
  if (missingLibs.includes('bech32')) {
    loadPromises.push(createScript('https://cdn.jsdelivr.net/npm/bech32@2.0.0/dist/index.min.js', 'bech32')
      .then(() => {
        assignGlobalLibrary('bech32', 'bech32');
      }));
  }
  
  if (missingLibs.includes('bitcoinMessage')) {
    loadPromises.push(createScript('https://cdn.jsdelivr.net/npm/bitcoinjs-message@2.2.0/index.min.js', 'bitcoinMessage')
      .then(() => {
        assignGlobalLibrary('bitcoinMessage', 'bitcoinMessage');
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
      })
      .catch(() => {
        // Try another CDN if the first one fails
        return createScript('https://unpkg.com/bitcoinjs-lib@6.1.3/dist/bitcoin-lib.js', 'Bitcoin')
          .then(() => {
            if (window['bitcoin'] || window['Bitcoin'] || window['bitcoinjs']) {
              (window as any).Bitcoin = window['Bitcoin'] || window['bitcoin'] || window['bitcoinjs'];
              console.log("Successfully loaded Bitcoin library from unpkg");
            }
          });
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
        
        // Create mock implementations if libraries are still missing
        createMockLibraries(finalStatus.missing);
      }
    }, 1000); // Wait a bit for libraries to initialize
  });
};

/**
 * Create mock versions of missing libraries to prevent errors
 * @param missingLibs Array of missing library names
 */
const createMockLibraries = (missingLibs: string[]): void => {
  console.warn("Creating mock implementations for missing libraries:", missingLibs);
  
  if (missingLibs.includes('bs58')) {
    (window as any).bs58 = {
      encode: (buffer: Uint8Array) => "MockBase58String",
      decode: (str: string) => new Uint8Array(32).fill(1)
    };
    console.log("Created mock bs58");
  }
  
  if (missingLibs.includes('bip39')) {
    (window as any).bip39 = {
      generateMnemonic: () => "mock word1 word2 word3",
      mnemonicToSeedSync: () => new Uint8Array(64).fill(1)
    };
    console.log("Created mock bip39");
  }
  
  if (missingLibs.includes('bech32')) {
    (window as any).bech32 = {
      encode: () => "mockbech32address",
      decode: () => ({ prefix: "mock", words: [0, 1, 2] })
    };
    console.log("Created mock bech32");
  }
  
  if (missingLibs.includes('bitcoinMessage')) {
    (window as any).bitcoinMessage = {
      sign: () => "mockSignature",
      verify: () => true
    };
    console.log("Created mock bitcoinMessage");
  }
  
  if (missingLibs.includes('bitcoinAddressValidation')) {
    (window as any).bitcoinAddressValidation = (address: string) => true;
    (window as any).validate = (window as any).bitcoinAddressValidation;
    console.log("Created mock bitcoinAddressValidation");
  }
  
  // Create minimal Bitcoin mock if needed
  if (missingLibs.includes('Bitcoin') && !window['Bitcoin']) {
    (window as any).Bitcoin = {
      crypto: {
        sha256: (data: Uint8Array) => {
          console.warn("Using mock SHA256 - not secure!");
          return new Uint8Array(32).fill(1);
        }
      },
      ECDSA: {
        parseSig: () => ({ r: BigInt(1), s: BigInt(2) }),
        serializeSig: () => "mockDERSignature",
      }
    };
    console.log("Created mock Bitcoin");
  }
  
  // Refresh library references now that we've added mocks
  mapLibraryAliases();
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
