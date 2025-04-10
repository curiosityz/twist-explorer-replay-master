
/**
 * Utility to check if Bitcoin libraries are loaded and available
 */

import { checkBitcoinLibsLoaded } from './bitcoin-libs/check-status';
export { checkBitcoinLibsLoaded };

/**
 * Check if Bitcoin libraries are loaded and available
 */
export function areBitcoinLibrariesAvailable() {
  const requiredLibraries = ['Bitcoin', 'bip39', 'bs58', 'secp256k1'];
  const missingLibraries = requiredLibraries.filter(lib => !(window as any)[lib]);
  
  return {
    available: missingLibraries.length === 0,
    missingLibraries
  };
}

/**
 * Refresh references to Bitcoin libraries
 * This is useful after dynamically loading libraries
 */
export function refreshBitcoinLibraries() {
  // If there are alternative names for libraries, map them
  if (!window.Bitcoin && (window.bitcoin || window.bitcoinjs)) {
    window.Bitcoin = window.bitcoin || window.bitcoinjs;
    console.log("Mapped bitcoinjs to window.Bitcoin");
  }
  
  // Map noble-secp256k1 to window.secp256k1 if needed
  if (!window.secp256k1 && window.nobleSecp256k1) {
    window.secp256k1 = window.nobleSecp256k1;
    console.log("Mapped noble-secp256k1 to window.secp256k1");
  }
  
  // Check what's available
  const libs = {
    bitcoin: !!window.Bitcoin || !!window.bitcoin,
    bip39: !!window.bip39,
    bs58: !!window.bs58,
    secp256k1: !!window.secp256k1,
  };
  
  console.log("Bitcoin libraries availability:", libs);
  return libs;
}
