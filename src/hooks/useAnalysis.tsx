import { useState, useEffect } from 'react';
import { AnalysisResult } from '@/types';
import { analyzeTransaction } from '@/lib/vulnerabilityUtils';
import { recoverPrivateKeyFromFragments, verifyRecoveredPrivateKey } from '@/lib/analysis/keyRecoveryUtils';
import { useClipboard } from '@/hooks/useClipboard';
import { useAnalysisError } from '@/hooks/useAnalysisError';
import { useTransactionAnalysisCheck } from '@/hooks/useTransactionAnalysisCheck';

export const useAnalysis = (txid?: string, startAnalysis = false) => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  
  const { copied, copyToClipboard } = useClipboard();
  const { error, setError, handleAnalysisError } = useAnalysisError();
  const { isDuplicate, setIsDuplicate, checkIfTransactionIsAnalyzed, loadExistingAnalysis } = useTransactionAnalysisCheck();

  useEffect(() => {
    if (txid && startAnalysis) {
      handleAnalyzeTransaction();
    }
  }, [txid, startAnalysis]);

  useEffect(() => {
    if (!analysisResult) return;
    
    // If the result already has a recovered private key, use it directly
    if (analysisResult.recoveredPrivateKey) {
      setPrivateKey(analysisResult.recoveredPrivateKey);
      
      if (analysisResult.publicKey) {
        console.log("Verifying pre-recovered private key against public key...");
        const isValid = verifyRecoveredPrivateKey(
          analysisResult.recoveredPrivateKey,
          analysisResult.publicKey
        );
        setVerificationResult(isValid);
      }
      return;
    }
    
    // Otherwise try to recover it from fragments
    const recoveryResult = recoverPrivateKeyFromFragments(analysisResult, txid);
    setPrivateKey(recoveryResult.privateKey);
    setVerificationResult(recoveryResult.verificationResult);
    
  }, [analysisResult, txid]);

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
          const loadedResult = await loadExistingAnalysis(existingAnalysis.id);
          setAnalysisResult(loadedResult);
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
      await handleAnalysisError(error, txid);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyPrivateKey = () => {
    copyToClipboard(privateKey, "Private key copied to clipboard");
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
