
import { useState } from 'react';
import { supabase, Tables } from '@/integrations/supabase/client';

/**
 * Hook for handling analysis errors
 */
export const useAnalysisError = () => {
  const [error, setError] = useState<string | null>(null);
  
  const handleAnalysisError = async (error: unknown, txid?: string) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Analysis error:', error);
    setError(errorMessage);
    
    if (txid) {
      try {
        const failedAnalysis = {
          txid: txid,
          vulnerability_type: 'unknown',
          public_key: { x: '0x0', y: '0x0', isOnCurve: false } as unknown as Record<string, any>,
          status: 'failed',
          message: errorMessage
        };
        
        const { error: saveError } = await supabase
          .from(Tables.vulnerability_analyses)
          .upsert(failedAnalysis);
          
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
