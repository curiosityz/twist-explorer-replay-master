
/**
 * Initialize application dependencies
 */

// Import the refresh function from bitcoinLibsCheck
import { areBitcoinLibrariesAvailable, refreshBitcoinLibraries } from './crypto/bitcoinLibsCheck';

/**
 * Initialize all required libraries and dependencies for the application
 * @returns Promise that resolves when all libraries are loaded
 */
export async function initializeApplication(): Promise<void> {
  try {
    console.log("Initializing application...");
    
    // First refresh library references to ensure all available libraries are detected
    refreshBitcoinLibraries();
    
    // Check if Bitcoin libraries are available
    const libStatus = areBitcoinLibrariesAvailable();
    if (!libStatus.available) {
      console.warn(`Bitcoin libraries not loaded: Missing ${libStatus.missingLibraries.join(', ')}`);
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

/**
 * Load required external libraries dynamically
 * @returns Promise that resolves when libraries are loaded
 */
export async function loadLibraries(): Promise<void> {
  try {
    console.log("Loading external libraries...");
    
    // Load polyfills if needed
    await loadPolyfills();
    
    // Load cryptocurrency libraries
    await loadCryptoLibraries();
    
    console.log("Libraries loaded successfully");
  } catch (error) {
    console.error("Error loading libraries:", error);
    throw error;
  }
}

/**
 * Load browser polyfills if needed for older browsers
 */
async function loadPolyfills(): Promise<void> {
  // No polyfills needed for modern browsers
  return Promise.resolve();
}

/**
 * Load cryptocurrency libraries required for the application
 */
async function loadCryptoLibraries(): Promise<void> {
  try {
    const libraries: Record<string, string> = {
      'bitcoin': 'https://cdn.jsdelivr.net/npm/bitcoinjs-lib@5.2.0/dist/bitcoin.min.js',
      'bip39': 'https://cdn.jsdelivr.net/npm/bip39@3.1.0/dist/bip39.min.js',
      'bs58': 'https://cdn.jsdelivr.net/npm/bs58@5.0.0/dist/bs58.min.js',
      'secp256k1': 'https://cdn.jsdelivr.net/npm/@noble/secp256k1@1.7.1/dist/secp256k1.min.js'
    };
    
    const loadPromises = Object.entries(libraries).map(async ([name, url]) => {
      if (!(window as any)[name]) {
        try {
          const script = document.createElement('script');
          script.src = url;
          script.async = true;
          
          const loadPromise = new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${name} from ${url}`));
          });
          
          document.head.appendChild(script);
          return loadPromise;
        } catch (error) {
          console.error(`Error loading ${name}:`, error);
          throw error;
        }
      }
    });
    
    await Promise.all(loadPromises);
    
    // Refresh references after loading
    refreshBitcoinLibraries();
  } catch (error) {
    console.warn("Error during library loading:", error);
    throw error;
  }
}
