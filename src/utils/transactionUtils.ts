
/**
 * Utility functions for working with Bitcoin transaction IDs
 */

/**
 * Extracts transaction IDs from various input formats
 * @param input - String or object containing transaction IDs
 * @returns Array of transaction IDs
 */
export const extractTransactionIds = (input: string | any[]): string[] => {
  // If input is already an array
  if (Array.isArray(input)) {
    return input
      .map(item => {
        // If array contains objects with txid
        if (item && typeof item === 'object' && 'txid' in item) {
          return item.txid;
        }
        // If array contains strings (direct txids)
        if (typeof item === 'string') {
          return item;
        }
        return null;
      })
      .filter(Boolean) as string[];
  }
  
  // If input is a string, try to parse it
  if (typeof input === 'string') {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(input);
      return extractTransactionIds(parsed);
    } catch (e) {
      // Not valid JSON, try to extract as plain text list
      // Split by common delimiters and filter valid txid format
      return input
        .split(/[\s,\n]+/)
        .map(line => line.trim())
        .filter(line => /^[a-fA-F0-9]{64}$/.test(line));
    }
  }
  
  // If input is an object
  if (input && typeof input === 'object') {
    // If it has a transactions array
    if ('transactions' in input && Array.isArray(input.transactions)) {
      return extractTransactionIds(input.transactions);
    }
    
    // If it has a txid property directly
    if ('txid' in input && typeof input.txid === 'string') {
      return [input.txid];
    }
    
    // If it's some other object format, try to find txids in values
    return Object.values(input)
      .flatMap(val => {
        if (Array.isArray(val)) return extractTransactionIds(val);
        if (val && typeof val === 'object') return extractTransactionIds(val);
        if (typeof val === 'string' && /^[a-fA-F0-9]{64}$/.test(val)) return [val];
        return [];
      });
  }
  
  return [];
};

/**
 * Validates if a string is a valid Bitcoin transaction ID
 * @param txid - Transaction ID to validate
 * @returns Boolean indicating if the string is a valid txid
 */
export const isValidTxid = (txid: string): boolean => {
  // Basic validation: check if it's a valid hex string of 64 characters (32 bytes)
  return /^[a-fA-F0-9]{64}$/.test(txid);
};
