
/**
 * Utility functions for managing private key storage locally
 */

import { WalletKey } from './walletUtils';
import { normalizePrivateKey } from './cryptoUtils';
import { testCrtImplementation } from './crypto/crtUtils';

const STORAGE_KEY = 'maverick_imported_keys';
const RECOVERED_KEYS_STORAGE_KEY = 'maverick_recovered_keys';

/**
 * Save imported keys to local storage
 * @param keys Array of wallet keys to store
 */
export const saveImportedKeys = (keys: WalletKey[]): void => {
  try {
    // Only store essential data for security purposes
    const keysToStore = keys.map(key => ({
      privateKey: key.privateKey,
      network: key.network,
      address: key.address,
      balance: key.balance || 0,
      verified: key.verified
    }));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keysToStore));
    console.log(`Saved ${keysToStore.length} keys to local storage`);
  } catch (error) {
    console.error('Error saving keys to local storage:', error);
  }
};

/**
 * Load imported keys from local storage
 * @returns Array of stored wallet keys or empty array if none found
 */
export const loadImportedKeys = (): Partial<WalletKey>[] => {
  try {
    const storedKeys = localStorage.getItem(STORAGE_KEY);
    if (!storedKeys) return [];
    
    const parsedKeys = JSON.parse(storedKeys);
    console.log(`Loaded ${parsedKeys.length} keys from local storage`);
    
    return parsedKeys;
  } catch (error) {
    console.error('Error loading keys from local storage:', error);
    return [];
  }
};

/**
 * Save recovered key fragments to local storage
 * @param txid Transaction ID
 * @param fragments Private key fragments (modulo values)
 * @param combinedKey Reconstructed private key (if available)
 */
export const saveKeyFragments = (
  txid: string, 
  fragments: Record<string, string>, 
  combinedKey?: string
): void => {
  try {
    const storedData = localStorage.getItem(RECOVERED_KEYS_STORAGE_KEY);
    const recoveredKeys = storedData ? JSON.parse(storedData) : {};
    
    recoveredKeys[txid] = {
      modulo_values: fragments,
      combined_fragments: combinedKey,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(RECOVERED_KEYS_STORAGE_KEY, JSON.stringify(recoveredKeys));
    console.log(`Saved key fragments for transaction ${txid}`);
    
    // Log the combined key if available
    if (combinedKey) {
      console.log(`Stored recovered key: ${combinedKey}`);
    }
  } catch (error) {
    console.error('Error saving key fragments to local storage:', error);
  }
};

/**
 * Load key fragments for a specific transaction
 * @param txid Transaction ID
 * @returns Object containing fragments and combined key data
 */
export const loadKeyFragments = (txid: string) => {
  try {
    const storedData = localStorage.getItem(RECOVERED_KEYS_STORAGE_KEY);
    if (!storedData) return null;
    
    const recoveredKeys = JSON.parse(storedData);
    
    if (recoveredKeys[txid]) {
      console.log(`Loaded key fragments for transaction ${txid}`);
      if (recoveredKeys[txid].combined_fragments) {
        console.log(`Found recovered key: ${recoveredKeys[txid].combined_fragments}`);
      }
    }
    
    return recoveredKeys[txid] || null;
  } catch (error) {
    console.error('Error loading key fragments from local storage:', error);
    return null;
  }
};

/**
 * Run a test of the CRT implementation to verify it's working correctly
 * @returns Test result object
 */
export const runCrtTest = () => {
  const result = testCrtImplementation();
  console.log("CRT test result:", result);
  
  if (result.passed) {
    console.log("✅ CRT implementation test passed!");
    console.log(`Expected: ${result.expectedBigInt}`);
    console.log(`Actual: ${result.resultBigInt}`);
    console.log(`Hex: ${result.actualHex}`);
  } else {
    console.error("❌ CRT implementation test failed!");
    console.error(`Expected: ${result.expectedBigInt}`);
    console.error(`Actual: ${result.resultBigInt}`);
  }
  
  return result;
};

// Run a CRT test when this module is loaded to verify the implementation is working
runCrtTest();
