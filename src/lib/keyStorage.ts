
/**
 * Utility functions for managing private key storage locally
 */

import { WalletKey } from './walletUtils';
import { normalizePrivateKey } from './cryptoUtils';

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
    return recoveredKeys[txid] || null;
  } catch (error) {
    console.error('Error loading key fragments from local storage:', error);
    return null;
  }
};

/**
 * Test function to verify the CRT implementation with known values
 */
export const testCrtImplementation = () => {
  try {
    // Import required functions
    const { combinePrivateKeyFragments } = require('./crypto/crtUtils');
    
    // Test case with fragments that should produce 9606208636557092712
    const testFragments = {
      "0x11": "0x5",    // 17: 5
      "0x13": "0x3",    // 19: 3
      "0x17": "0xc",    // 23: 12
      "0x19": "0x10"    // 25: 16
    };
    
    console.log("Running CRT test with fragments:", testFragments);
    
    // Call the combinePrivateKeyFragments function with the test fragments
    const result = combinePrivateKeyFragments(testFragments);
    console.log("CRT test raw result:", result);
    
    // Convert expected value for comparison
    const expectedBigInt = 9606208636557092712n;
    const expectedHex = `0x${expectedBigInt.toString(16)}`;
    console.log("Expected hex:", expectedHex);
    
    // Now format the result for comparison with expected output
    const normalizedResult = normalizePrivateKey(result || '');
    console.log("Normalized result:", normalizedResult);
    
    // Compare with exact expected value
    const resultBigInt = BigInt(result || '0');
    const exactMatch = resultBigInt === expectedBigInt;
    
    return {
      rawResult: result,
      normalizedResult: normalizedResult,
      expectedResult: expectedHex,
      resultBigInt: resultBigInt.toString(),
      expectedBigInt: expectedBigInt.toString(),
      exactMatch: exactMatch,
      passed: exactMatch
    };
  } catch (error) {
    console.error("Error in CRT test:", error);
    return { error: String(error), passed: false };
  }
};
