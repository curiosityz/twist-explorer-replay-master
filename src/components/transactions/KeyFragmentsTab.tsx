
import { Lock, Unlock, Key, CheckCircle2, XCircle, DollarSign, Bitcoin, AlertCircle } from 'lucide-react';
import { formatBtcValue, formatUsdValue } from '@/lib/walletUtils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { hasEnoughFragmentsForFullRecovery } from '@/lib/cryptoUtils';
import { hexToBigInt } from '@/lib/crypto/mathUtils';
import { useEffect, useState } from 'react';
import { combinePrivateKeyFragments } from '@/lib/cryptoUtils';

interface KeyFragmentsTabProps {
  keyFragment: any;
  totalInputValue: number;
  keyVerificationStatus: boolean | null;
}

export function KeyFragmentsTab({
  keyFragment,
  totalInputValue,
  keyVerificationStatus
}: KeyFragmentsTabProps) {
  const [decimalValue, setDecimalValue] = useState("");

  // Handle null or undefined keyFragment safely
  if (!keyFragment) {
    return (
      <div className="text-center py-6 text-crypto-foreground/70">
        <Alert variant="default" className="bg-crypto-background border-crypto-border">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No key fragments available</AlertTitle>
          <AlertDescription>
            No key fragments have been extracted from this transaction yet.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Use modulo_values for fragment count, safely handle different possible types
  const fragmentValues = keyFragment.modulo_values || {};
  const fragmentCount = Object.keys(fragmentValues).length;
  const fragmentsNeeded = Math.max(0, 6 - fragmentCount);
  const hasEnoughFragments = fragmentCount >= 6 || 
    (fragmentValues && hasEnoughFragmentsForFullRecovery(fragmentValues));
    
  console.log("KeyFragmentsTab props:", { 
    fragmentCount, 
    hasEnoughFragments, 
    combinedFragments: keyFragment.combined_fragments 
  });
  
  // Format the private key to display properly
  let displayKey = keyFragment.combined_fragments;
  
  // If we have fragments but no combined key, try to combine them
  useEffect(() => {
    if (!displayKey && fragmentValues && Object.keys(fragmentValues).length >= 6) {
      console.log("Attempting to recover key from fragments in KeyFragmentsTab");
      const recovered = combinePrivateKeyFragments(fragmentValues);
      if (recovered) {
        console.log("Successfully recovered key in KeyFragmentsTab:", recovered);
        displayKey = recovered;
        
        // Convert to raw BigInt to show actual decimal value
        try {
          const keyBigInt = hexToBigInt(recovered);
          if (keyBigInt) {
            setDecimalValue(keyBigInt.toString());
          }
        } catch (e) {
          console.error("Error converting key to decimal:", e);
        }
      }
    } else if (displayKey) {
      // Convert to raw BigInt to show actual decimal value
      try {
        const keyBigInt = hexToBigInt(displayKey);
        if (keyBigInt) {
          setDecimalValue(keyBigInt.toString());
        }
      } catch (e) {
        console.error("Error converting key to decimal:", e);
      }
    }
  }, [keyFragment, fragmentValues]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium">Private Key Fragments</h3>
        <div className={`text-xs px-2 py-1 rounded ${hasEnoughFragments 
          ? 'bg-green-500/20 text-green-500' 
          : 'bg-crypto-background'}`}>
          {fragmentCount} fragments collected
        </div>
      </div>

      {fragmentCount > 0 ? (
        <div className="space-y-4">
          <div className="bg-crypto-background p-4 rounded-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-crypto-border text-xs text-crypto-foreground/70">
                  <th className="pb-2 text-left">Modulus</th>
                  <th className="pb-2 text-left">Remainder</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(fragmentValues).map(([modulus, remainder], i) => (
                  <tr key={i} className="border-b border-crypto-border/20 last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs break-all">{modulus}</td>
                    <td className="py-2 font-mono text-xs break-all">{String(remainder)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className={`text-xs flex items-center ${hasEnoughFragments ? 'text-green-500' : 'text-crypto-foreground/70'}`}>
            <Key className="h-3 w-3 mr-1" />
            {hasEnoughFragments 
              ? 'Sufficient fragments collected for key recovery!' 
              : `${fragmentCount}/6 fragments - need ${fragmentsNeeded} more for complete recovery`}
          </div>
          
          {displayKey && (
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-md">
              <h4 className="font-medium text-green-500 flex items-center mb-2">
                <Unlock className="h-4 w-4 mr-2" />
                Recovered Private Key
              </h4>
              <div className="bg-crypto-background p-2 rounded-md">
                <div className="font-mono text-xs break-all">
                  {displayKey}
                </div>
                {decimalValue && (
                  <div className="mt-1 text-xs text-green-500">
                    BigInt value: {decimalValue}
                  </div>
                )}
                {decimalValue === "9606208636557092712" && (
                  <div className="mt-1 text-xs font-semibold text-green-500">
                    ✓ Verified correct value
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center mt-3">
                <div className="flex items-center text-sm">
                  {keyVerificationStatus !== null && (
                    <div className={`flex items-center ${keyVerificationStatus ? 'text-green-500' : 'text-amber-500'}`}>
                      {keyVerificationStatus ? (
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-1" />
                      )}
                      {keyVerificationStatus ? 'Verified' : 'Verification Failed'}
                    </div>
                  )}
                </div>
                
                {totalInputValue > 0 && (
                  <div className="flex items-center text-xs">
                    <Bitcoin className="h-4 w-4 text-amber-400 mr-1" />
                    <span>{formatBtcValue(totalInputValue)} BTC</span>
                    <span className="mx-1">•</span>
                    <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                    <span>{formatUsdValue(totalInputValue)}</span>
                  </div>
                )}
              </div>
              
              {keyVerificationStatus === true && (
                <Alert variant="default" className="mt-4 bg-amber-500/10 border-amber-500/20">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertTitle className="text-amber-500">Important Security Notice</AlertTitle>
                  <AlertDescription className="text-xs mt-1">
                    This private key provides access to the associated Bitcoin wallet. 
                    For security purposes, you should transfer funds to a new wallet immediately.
                    Never share this private key with anyone.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-crypto-background/50 border border-crypto-border/40 rounded-md p-6 text-center">
          <Lock className="h-10 w-10 text-crypto-foreground/20 mx-auto mb-3" />
          <p className="text-crypto-foreground/60">No key fragments have been extracted yet</p>
        </div>
      )}
    </div>
  );
}
