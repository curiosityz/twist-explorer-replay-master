
/**
 * Utility functions for managing private key storage locally
 */

import { WalletKey } from './walletUtils';

const STORAGE_KEY = 'maverick_imported_keys';

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
 * Update useWalletKeyManagement.ts to use the local storage functions
 */
