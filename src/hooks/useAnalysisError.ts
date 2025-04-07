
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
    
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Analysis error:', error);
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
          message: errorMessage
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
