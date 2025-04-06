
import { supabase } from '@/integrations/supabase/client';
import { isValidTxid } from '@/utils/transactionUtils';

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
    firstValidTxid: validTxids.length > 0 ? validTxids[0] : null
  };
};
