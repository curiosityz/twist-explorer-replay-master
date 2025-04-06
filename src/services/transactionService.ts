
import { supabase } from '@/integrations/supabase/client';
import { isValidTxid } from '@/utils/transactionUtils';
import { chainstackService } from './chainstackService';
import { toast } from 'sonner';

/**
 * Process and store transaction IDs in the database
 * @param txids - Array of transaction IDs to process
 * @returns Object with counts of processed and error transactions
 */
export const processTransactions = async (txids: string[]) => {
  // Filter for valid transaction IDs
  const validTxids = txids.filter(isValidTxid);
  
  let successCount = 0;
  let errorCount = 0;
  
  // Store each transaction ID in the database
  for (let i = 0; i < validTxids.length; i++) {
    const txid = validTxids[i];
    
    try {
      // Store transaction ID in database
      const { error } = await supabase
        .from('blockchain_transactions')
        .upsert({
          txid: txid,
          chain: 'BTC',
          processed: false
        }, { onConflict: 'txid' });

      if (error) {
        console.error('Error storing transaction:', error);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
      errorCount++;
    }
  }
  
  return {
    successCount,
    errorCount,
    processedCount: successCount,
    totalValid: validTxids.length,
    totalInput: txids.length,
    firstValidTxid: validTxids.length > 0 ? validTxids[0] : null,
    validTxids: validTxids // Return all valid transaction IDs
  };
};

/**
 * Fetch detailed transaction data from blockchain API
 * @param txid - Transaction ID to fetch
 * @returns Transaction data or null if error
 */
export const fetchTransactionDetails = async (txid: string) => {
  if (!isValidTxid(txid)) {
    toast.error('Invalid transaction ID format');
    return null;
  }
  
  try {
    // First check if we have decoded data in our database
    const { data: storedTx, error: dbError } = await supabase
      .from('blockchain_transactions')
      .select('decoded_json')
      .eq('txid', txid)
      .maybeSingle();
    
    if (!dbError && storedTx?.decoded_json) {
      // Return stored data if available
      const parsedData = typeof storedTx.decoded_json === 'string' 
        ? JSON.parse(storedTx.decoded_json) 
        : storedTx.decoded_json;
      
      return parsedData;
    }
    
    // If not in database, fetch from blockchain API
    const txData = await chainstackService.getTransaction(txid);
    
    if (txData) {
      // Store the fetched data in our database for future use
      await supabase
        .from('blockchain_transactions')
        .update({ 
          decoded_json: txData,
          raw_hex: txData.hex,
          processed: true
        })
        .eq('txid', txid);
    }
    
    return txData;
  } catch (error) {
    console.error(`Failed to fetch transaction ${txid}:`, error);
    toast.error('Failed to fetch transaction details');
    return null;
  }
};

/**
 * Fetch multiple transactions by their IDs
 * @param txids - Array of transaction IDs to fetch
 * @returns Array of transaction data objects
 */
export const fetchMultipleTransactions = async (txids: string[]) => {
  const validTxids = txids.filter(isValidTxid);
  const results = [];
  
  for (const txid of validTxids) {
    try {
      const txData = await fetchTransactionDetails(txid);
      if (txData) {
        results.push({
          txid,
          data: txData,
          status: 'success'
        });
      } else {
        results.push({
          txid,
          data: null,
          status: 'error'
        });
      }
    } catch (error) {
      console.error(`Failed to fetch transaction ${txid}:`, error);
      results.push({
        txid,
        data: null,
        status: 'error',
        error: error
      });
    }
  }
  
  return results;
};
