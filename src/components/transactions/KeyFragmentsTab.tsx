
import { Lock, Unlock, Key, CheckCircle2, XCircle, DollarSign, Bitcoin } from 'lucide-react';
import { formatBtcValue, formatUsdValue } from '@/lib/walletUtils';

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
  if (!keyFragment) {
    return (
      <div className="text-center py-6 text-crypto-foreground/70">
        No key fragments available for this transaction
      </div>
    );
  }

  // Use modulo_values for fragment count if it exists, fallback to empty object
  const fragmentValues = keyFragment.modulo_values || {};
  const fragmentCount = Object.keys(fragmentValues).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium">Private Key Fragments</h3>
        <div className="text-xs bg-crypto-background px-2 py-1 rounded">
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
                    <td className="py-2 pr-4 font-mono">{modulus}</td>
                    <td className="py-2 font-mono">{remainder as string}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="text-xs flex items-center">
            <Key className="h-3 w-3 mr-1" />
            {fragmentCount >= 6 
              ? 'Sufficient fragments collected for key recovery!' 
              : `${fragmentCount}/6 fragments - need ${Math.max(0, 6 - fragmentCount)} more for complete recovery`}
          </div>
          
          {keyFragment.combined_fragments && (
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-md">
              <h4 className="font-medium text-green-500 flex items-center mb-2">
                <Unlock className="h-4 w-4 mr-2" />
                Recovered Private Key
              </h4>
              <div className="bg-crypto-background p-2 rounded-md">
                <div className="font-mono text-xs break-all">
                  {keyFragment.combined_fragments}
                </div>
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
