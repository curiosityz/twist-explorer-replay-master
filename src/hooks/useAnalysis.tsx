
import { useState, useEffect } from 'react';
import { supabase, Tables } from '@/integrations/supabase/client';
import { AnalysisResult, CryptographicPoint, Signature } from '@/types';
import { combinePrivateKeyFragments, verifyPrivateKey } from '@/lib/cryptoUtils';
import { toast } from 'sonner';
import { analyzeTransaction } from '@/lib/vulnerabilityUtils';

export const useAnalysis = (txid?: string, startAnalysis = false) => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  useEffect(() => {
    if (txid && startAnalysis) {
      handleAnalyzeTransaction();
    }
  }, [txid, startAnalysis]);

  useEffect(() => {
    if (analysisResult?.privateKeyModulo && Object.keys(analysisResult.privateKeyModulo).length >= 6) {
      const calculatedKey = combinePrivateKeyFragments(analysisResult.privateKeyModulo);
      setPrivateKey(calculatedKey);
      
      if (calculatedKey && analysisResult.publicKey) {
        const isValid = verifyPrivateKey(calculatedKey, analysisResult.publicKey.x, analysisResult.publicKey.y);
        setVerificationResult(isValid);
      }
    } else {
      setPrivateKey(null);
    }
  }, [analysisResult]);

  const checkIfTransactionIsAnalyzed = async (txidToCheck: string) => {
    const { data, error } = await supabase
      .from(Tables.vulnerability_analyses)
      .select('id, vulnerability_type')
      .eq('txid', txidToCheck)
      .maybeSingle();
      
    if (error) {
      console.error("Error checking if transaction is analyzed:", error);
      return null;
    }
    
    return data;
  };

  const handleAnalyzeTransaction = async () => {
    if (!txid) return;

    setIsAnalyzing(true);
    setError(null);
    setVerificationResult(null);
    setPrivateKey(null);
    setIsDuplicate(false);

    try {
      const existingAnalysis = await checkIfTransactionIsAnalyzed(txid);
      
      if (existingAnalysis) {
        const existingVulnerabilityType = existingAnalysis.vulnerability_type;
        
        if (existingVulnerabilityType !== 'unknown') {
          setIsDuplicate(true);
          toast.info("This transaction has already been analyzed", {
            description: "The key fragments have already been extracted from this transaction."
          });
          
          const { data: analysisData, error: loadError } = await supabase
            .from(Tables.vulnerability_analyses)
            .select('*')
            .eq('id', existingAnalysis.id)
            .single();
            
          if (loadError) {
            console.error("Error loading existing analysis:", loadError);
            throw new Error("Failed to load existing analysis");
          }
          
          const privateKeyModulo: Record<string, string> = {};
          
          if (analysisData.private_key_modulo && typeof analysisData.private_key_modulo === 'object') {
            Object.entries(analysisData.private_key_modulo).forEach(([key, value]) => {
              privateKeyModulo[key] = String(value);
            });
          }
          
          const loadedResult: AnalysisResult = {
            txid: analysisData.txid,
            vulnerabilityType: analysisData.vulnerability_type,
            publicKey: analysisData.public_key as unknown as CryptographicPoint,
            signature: analysisData.signature as unknown as Signature,
            twistOrder: analysisData.twist_order,
            primeFactors: Array.isArray(analysisData.prime_factors) ? 
              analysisData.prime_factors.map(String) : [],
            privateKeyModulo: privateKeyModulo,
            status: analysisData.status as "completed" | "analyzing" | "failed" | "pending",
            message: analysisData.message
          };
          
          setAnalysisResult(loadedResult);
          
          if (loadedResult.publicKey) {
            const publicKeyHex = loadedResult.publicKey.x + loadedResult.publicKey.y;
            
            const { data: keyData, error: keyError } = await supabase
              .from(Tables.private_key_fragments)
              .select('*')
              .eq('public_key_hex', publicKeyHex)
              .maybeSingle();
              
            if (!keyError && keyData && keyData.combined_fragments) {
              setPrivateKey(keyData.combined_fragments);
              
              const isValid = verifyPrivateKey(
                keyData.combined_fragments, 
                loadedResult.publicKey.x, 
                loadedResult.publicKey.y
              );
              setVerificationResult(isValid);
            }
          }
          
          setIsAnalyzing(false);
          return;
        }
      }

      // If not a duplicate, analyze the transaction
      const result = await analyzeTransaction(txid);
      
      if (result) {
        setAnalysisResult(result);
      } else {
        throw new Error("Analysis failed to return a result");
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      
      if (txid) {
        try {
          const failedAnalysis = {
            txid: txid,
            vulnerability_type: 'unknown',
            public_key: { x: '0x0', y: '0x0', isOnCurve: false } as unknown as Record<string, any>,
            status: 'failed',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
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
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyPrivateKey = () => {
    if (privateKey) {
      navigator.clipboard.writeText(privateKey);
      setCopied(true);
      toast.success("Private key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return {
    analysisResult,
    isAnalyzing,
    error,
    verificationResult,
    copied,
    privateKey,
    isDuplicate,
    handleAnalyzeTransaction,
    copyPrivateKey
  };
};
