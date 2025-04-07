import { useState, useEffect } from 'react';
import { supabase, Tables } from '@/integrations/supabase/client';
import { AnalysisResult, CryptographicPoint, Signature } from '@/types';
import { 
  combinePrivateKeyFragments, 
  verifyPrivateKey, 
  hasEnoughFragmentsForFullRecovery 
} from '@/lib/cryptoUtils';
import { toast } from 'sonner';
import { analyzeTransaction } from '@/lib/vulnerabilityUtils';
import { saveKeyFragments } from '@/lib/keyStorage';

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
    if (analysisResult?.recoveredPrivateKey) {
      setPrivateKey(analysisResult.recoveredPrivateKey);
      
      if (analysisResult.publicKey) {
        console.log("Verifying pre-recovered private key against public key...");
        const isValid = verifyPrivateKey(
          analysisResult.recoveredPrivateKey,
          analysisResult.publicKey.x,
          analysisResult.publicKey.y
        );
        setVerificationResult(isValid);
        
        if (isValid) {
          toast.success("Private key successfully verified!", {
            description: "The key matches the public key in this transaction."
          });
        } else {
          toast.warning("Private key verification failed", {
            description: "The recovered key does not match the public key."
          });
        }
      }
      return;
    }
    
    if (analysisResult?.privateKeyModulo) {
      const fragmentCount = Object.keys(analysisResult.privateKeyModulo).length;
      console.log(`Found ${fragmentCount} key fragments`);
      
      if (fragmentCount >= 2) {
        if (hasEnoughFragmentsForFullRecovery(analysisResult.privateKeyModulo) || fragmentCount >= 6) {
          console.log("Attempting to recover private key from fragments...");
          const calculatedKey = combinePrivateKeyFragments(analysisResult.privateKeyModulo);
          
          if (calculatedKey) {
            console.log("Successfully calculated private key:", calculatedKey);
            setPrivateKey(calculatedKey);
            
            if (txid) {
              saveKeyFragments(txid, analysisResult.privateKeyModulo, calculatedKey);
            }
            
            if (analysisResult.publicKey) {
              console.log("Verifying recovered private key against public key...");
              const isValid = verifyPrivateKey(
                calculatedKey, 
                analysisResult.publicKey.x, 
                analysisResult.publicKey.y
              );
              setVerificationResult(isValid);
              
              if (isValid) {
                toast.success("Private key successfully recovered and verified!", {
                  description: "The key matches the public key in this transaction."
                });
              } else {
                toast.warning("Private key recovery failed verification", {
                  description: "The recovered key does not match the public key."
                });
              }
            }
          } else {
            console.error("Failed to recover private key from fragments");
            setPrivateKey(null);
          }
        } else {
          console.log("Not enough fragments for full key recovery");
          setPrivateKey(null);
        }
      } else {
        setPrivateKey(null);
      }
    } else {
      setPrivateKey(null);
    }
  }, [analysisResult, txid]);

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
            message: analysisData.message,
            recoveredPrivateKey: analysisData.recovered_private_key
          };
          
          setAnalysisResult(loadedResult);
          
          if (loadedResult.recoveredPrivateKey) {
            setPrivateKey(loadedResult.recoveredPrivateKey);
            
            if (loadedResult.publicKey) {
              const isValid = verifyPrivateKey(
                loadedResult.recoveredPrivateKey,
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
