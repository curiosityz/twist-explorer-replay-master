
/**
 * Extract transaction IDs from various input formats
 * @param input - String containing transaction IDs in various formats
 * @returns Array of extracted transaction IDs
 */
export const extractTransactionIds = (input: string): string[] => {
  if (!input || typeof input !== 'string') return [];
  
  let txids: string[] = [];
  
  // Try to parse as JSON
  try {
    const parsed = JSON.parse(input);
    
    // If parsed result is an array, extract txids directly
    if (Array.isArray(parsed)) {
      txids = parsed
        .map(item => typeof item === 'string' ? item.trim() : '')
        .filter(item => item !== '');
    } 
    // Handle object with transactions field (e.g., export from some wallets)
    else if (parsed && typeof parsed === 'object') {
      // Handle case where object has a transactions array property
      if (parsed.transactions && Array.isArray(parsed.transactions)) {
        txids = parsed.transactions
          .map((tx: any) => {
            if (typeof tx === 'string') return tx.trim();
            if (tx && typeof tx === 'object' && tx.txid) return tx.txid.trim();
            return '';
          })
          .filter(txid => txid !== '');
      }
    }
  } catch (error) {
    // Not valid JSON, try other formats
    // Split by common separators (newline, comma)
    txids = input.split(/[\n,\s]+/)
      .map(item => item.trim())
      .filter(item => item !== '');
  }
  
  // Filter for only valid txids
  return txids.filter(isValidTxid);
};

/**
 * Validate Bitcoin transaction ID format
 * @param txid - Transaction ID to validate
 * @returns Boolean indicating if the TXID is valid
 */
export const isValidTxid = (txid: string): boolean => {
  if (!txid || typeof txid !== 'string') return false;
  
  // Bitcoin TXIDs are 64 character hex strings
  const txidRegex = /^[a-fA-F0-9]{64}$/;
  return txidRegex.test(txid);
};
