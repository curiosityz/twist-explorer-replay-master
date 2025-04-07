
import { AnalysisResult } from '@/types';
import { combinePrivateKeyFragments, verifyPrivateKey, hasEnoughFragmentsForFullRecovery } from '@/lib/cryptoUtils';
import { saveKeyFragments } from '@/lib/keyStorage';
import { toast } from 'sonner';

/**
 * Attempts to recover a private key from the fragments in an analysis result
 * @param analysisResult The analysis result containing key fragments
 * @param txid Transaction ID for storage purposes
 * @returns Object containing the private key and verification result
 */
export const recoverPrivateKeyFromFragments = (
  analysisResult: AnalysisResult, 
  txid?: string
): { privateKey: string | null, verificationResult: boolean | null } => {
  if (!analysisResult.privateKeyModulo) {
    return { privateKey: null, verificationResult: null };
  }

  const fragmentCount = Object.keys(analysisResult.privateKeyModulo).length;
  console.log(`Found ${fragmentCount} key fragments`);
  
  if (fragmentCount < 2) {
    return { privateKey: null, verificationResult: null };
  }
  
  if (hasEnoughFragmentsForFullRecovery(analysisResult.privateKeyModulo) || fragmentCount >= 6) {
    console.log("Attempting to recover private key from fragments...");
    const calculatedKey = combinePrivateKeyFragments(analysisResult.privateKeyModulo);
    
    if (calculatedKey) {
      console.log("Successfully calculated private key:", calculatedKey);
      
      if (txid) {
        saveKeyFragments(txid, analysisResult.privateKeyModulo, calculatedKey);
      }
      
      let isValid = null;
      if (analysisResult.publicKey) {
        console.log("Verifying recovered private key against public key...");
        isValid = verifyPrivateKey(
          calculatedKey, 
          analysisResult.publicKey.x, 
          analysisResult.publicKey.y
        );
        
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
      
      return { privateKey: calculatedKey, verificationResult: isValid };
    }
  }
  
  return { privateKey: null, verificationResult: null };
};

/**
 * Verifies a recovered private key against a public key
 * @param privateKey The recovered private key
 * @param publicKey The public key to verify against
 * @returns Boolean indicating if verification passed
 */
export const verifyRecoveredPrivateKey = (
  privateKey: string | null,
  publicKey?: { x: string, y: string }
): boolean | null => {
  if (!privateKey || !publicKey) {
    return null;
  }
  
  return verifyPrivateKey(
    privateKey,
    publicKey.x,
    publicKey.y
  );
};
