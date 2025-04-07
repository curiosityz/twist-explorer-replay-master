
import { useState, useCallback } from 'react';
import { supabase, Tables } from '@/integrations/supabase/client';
import { AnalysisResult, CryptographicPoint, Signature, VulnerabilityType } from '@/types';
import { toast } from 'sonner';

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
        .single();
          
      if (loadError) {
        console.error("Error loading existing analysis:", loadError);
        throw new Error("Failed to load existing analysis");
      }
      
      const privateKeyModulo: Record<string, string> = {};
      
      if (analysisData.private_key_modulo && typeof analysisData.private_key_modulo === 'object') {
        Object.entries(analysisData.private_key_modulo as Record<string, any>).forEach(([key, value]) => {
          privateKeyModulo[key] = String(value);
        });
      }
      
      const loadedResult: AnalysisResult = {
        txid: analysisData.txid,
        vulnerabilityType: analysisData.vulnerability_type as VulnerabilityType,
        publicKey: analysisData.public_key as unknown as CryptographicPoint,
        signature: analysisData.signature as unknown as Signature,
        twistOrder: analysisData.twist_order,
        primeFactors: Array.isArray(analysisData.prime_factors) ? 
          analysisData.prime_factors.map(String) : [],
        privateKeyModulo: privateKeyModulo,
        status: analysisData.status as "completed" | "analyzing" | "failed" | "pending",
        message: analysisData.message,
        // Use optional chaining to safely access recovered_private_key which might not exist
        recoveredPrivateKey: analysisData.recovered_private_key ?? null
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
