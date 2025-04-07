
import { useState } from 'react';
import { supabase, Tables } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook for handling analysis errors
 */
export const useAnalysisError = () => {
  const [error, setError] = useState<string | null>(null);
  
  const handleAnalysisError = async (error: unknown, txid?: string) => {
    let errorMessage: string;
    let errorType: string = 'unknown';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Analysis error:', error);
      
      // Enhanced error categorization using imported libraries
      if (errorMessage.includes('extract cryptographic data')) {
        errorType = 'extraction';
        errorMessage = "Could not extract cryptographic data from this transaction. It may use a transaction format we don't currently support, or may not contain standard signature data.";
      } else if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
        errorType = 'network';
        errorMessage = "Network request failed. This could be due to CORS restrictions or connectivity issues.";
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorType = 'auth';
        errorMessage = "Authentication failed when accessing blockchain data. Please check your API credentials.";
      } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        errorType = 'notfound';
        errorMessage = "Transaction not found. Please verify the transaction ID is correct.";
      } else if (errorMessage.includes('parse') || errorMessage.includes('invalid format')) {
        errorType = 'parse';
        errorMessage = "Failed to parse transaction data. The format may be invalid or unsupported.";
      } else if (errorMessage.includes('secp256k1') || errorMessage.includes('curve')) {
        errorType = 'crypto';
        errorMessage = "Cryptographic error occurred. There may be an issue with the key or signature data.";
      } else if (errorMessage.includes('address validation')) {
        errorType = 'address';
        errorMessage = "Invalid Bitcoin address format detected.";
      }
    } else {
      errorMessage = 'Unknown error occurred';
      console.error('Analysis error (unknown type):', error);
    }
    
    // Set the error in state for display
    setError(errorMessage);
    
    // Show an error toast
    toast.error('Analysis failed', {
      description: errorMessage.length > 60 ? 
        `${errorMessage.substring(0, 60)}...` : 
        errorMessage
    });
    
    if (txid) {
      try {
        // Check if we already have an error record for this txid
        const { data: existingError } = await supabase
          .from(Tables.vulnerability_analyses)
          .select('id')
          .eq('txid', txid)
          .eq('status', 'failed')
          .maybeSingle();
        
        if (existingError) {
          console.log("Error record already exists for this transaction, updating...");
          
          // Update the existing record
          const { error: updateError } = await supabase
            .from(Tables.vulnerability_analyses)
            .update({
              message: errorMessage,
              error_type: errorType,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingError.id);
            
          if (updateError) {
            console.error("Error updating failed analysis record:", updateError);
          }
          
          return;
        }
        
        // Create a new failed analysis record
        const failedAnalysis = {
          txid: txid,
          vulnerability_type: 'unknown',
          public_key: { x: '0x0', y: '0x0', isOnCurve: false } as unknown as Record<string, any>,
          status: 'failed',
          message: errorMessage,
          error_type: errorType
        };
        
        const { error: saveError } = await supabase
          .from(Tables.vulnerability_analyses)
          .upsert(failedAnalysis, { onConflict: 'txid' });
          
        if (saveError) {
          console.error("Error saving failed analysis:", saveError);
        }
      } catch (dbError) {
        console.error('Database error while saving failed analysis:', dbError);
      }
    }
  };
  
  return {
    error,
    setError,
    handleAnalysisError
  };
};
