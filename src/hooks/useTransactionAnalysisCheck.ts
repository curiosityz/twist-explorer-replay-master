
import { useState, useCallback } from 'react';
import { supabase, Tables } from '@/integrations/supabase/client';
import { AnalysisResult, CryptographicPoint, Signature, VulnerabilityType } from '@/types';
import { toast } from 'sonner';
import { normalizeVulnerabilityAnalysis } from '@/lib/database';

/**
 * Hook for checking if a transaction has been previously analyzed
 */
export const useTransactionAnalysisCheck = () => {
  const [isDuplicate, setIsDuplicate] = useState(false);
  
  const checkIfTransactionIsAnalyzed = useCallback(async (txidToCheck: string) => {
    try {
      // Use eq and limit(1) to prevent multiple rows issue
      const { data, error } = await supabase
        .from(Tables.vulnerability_analyses)
        .select('id, vulnerability_type')
        .eq('txid', txidToCheck)
        .limit(1)
        .maybeSingle();
        
      if (error) {
        console.error("Error checking if transaction is analyzed:", error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Exception in checkIfTransactionIsAnalyzed:", error);
      return null;
    }
  }, []);

  const loadExistingAnalysis = useCallback(async (analysisId: string) => {
    try {
      const { data: analysisData, error: loadError } = await supabase
        .from(Tables.vulnerability_analyses)
        .select('*')
        .eq('id', analysisId)
        .maybeSingle();
          
      if (loadError) {
        console.error("Error loading existing analysis:", loadError);
        throw new Error("Failed to load existing analysis");
      }
      
      if (!analysisData) {
        throw new Error("No analysis data found");
      }
      
      // Normalize the data using our helper function
      const normalizedData = normalizeVulnerabilityAnalysis(analysisData);
      
      if (!normalizedData) {
        throw new Error("Failed to normalize analysis data");
      }
      
      const loadedResult: AnalysisResult = {
        txid: normalizedData.txid,
        vulnerabilityType: normalizedData.vulnerability_type as VulnerabilityType,
        publicKey: normalizedData.public_key as unknown as CryptographicPoint,
        signature: normalizedData.signature as unknown as Signature,
        twistOrder: normalizedData.twist_order,
        primeFactors: normalizedData.prime_factors || [],
        privateKeyModulo: normalizedData.private_key_modulo || {},
        status: normalizedData.status as "completed" | "analyzing" | "failed" | "pending",
        message: normalizedData.message,
        recoveredPrivateKey: normalizedData.recovered_private_key || null
      };
      
      setIsDuplicate(true);
      toast.info("This transaction has already been analyzed", {
        description: "The key fragments have already been extracted from this transaction."
      });
      
      return loadedResult;
    } catch (error) {
      console.error("Error in loadExistingAnalysis:", error);
      throw error;
    }
  }, []);
  
  return {
    isDuplicate,
    setIsDuplicate,
    checkIfTransactionIsAnalyzed,
    loadExistingAnalysis
  };
};
