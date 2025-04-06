
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

  // Use modulo_values for fragment count if it exists, fallback to private_key_modulo
  const fragmentCount = keyFragment.modulo_values 
    ? Object.keys(keyFragment.modulo_values).length 
    : 0;

  if (fragmentCount === 0) {
    return (
      <div className="text-center py-6">
        <Lock className="h-10 w-10 mx-auto mb-3 text-crypto-foreground/30" />
        <p className="text-crypto-foreground/70">
          No key fragments have been extracted from this transaction yet
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Private Key Status</h3>
        <div className={`p-4 rounded-md ${keyFragment.completed ? 'bg-green-500/10 border border-green-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {keyFragment.completed ? (
                <>
                  <Unlock className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-green-500 font-medium">
                    Private Key Recovered!
                    {keyVerificationStatus !== null && (
                      <span className={`ml-2 text-xs ${keyVerificationStatus ? 'text-green-500' : 'text-amber-500'}`}>
                        {keyVerificationStatus ? '(verified)' : '(verification failed)'}
                      </span>
                    )}
                  </span>
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5 text-amber-500 mr-2" />
                  <span className="text-amber-500 font-medium">Partial Key - {fragmentCount} fragments collected</span>
                </>
              )}
            </div>
            {keyFragment.completed && totalInputValue > 0 && (
              <div className="flex items-center">
                <Bitcoin className="h-4 w-4 text-amber-400 mr-1" />
                <span className="font-mono">{formatBtcValue(totalInputValue)} BTC</span>
                <span className="text-xs text-crypto-foreground/50 ml-1">recoverable</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {fragmentCount > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Fragments (Chinese Remainder Theorem)</h3>
          <div className="bg-crypto-background rounded-md p-4 font-mono text-xs">
            <table className="w-full">
              <thead>
                <tr className="border-b border-crypto-border">
                  <th className="pb-2 text-left text-crypto-foreground/70">Modulus</th>
                  <th className="pb-2 text-left text-crypto-foreground/70">Remainder</th>
                </tr>
              </thead>
              <tbody>
                {keyFragment.modulo_values && Object.entries(keyFragment.modulo_values).map(([mod, remainder], index) => (
                  <tr key={index} className="border-b border-crypto-border/20 last:border-0">
                    <td className="py-2 pr-4">{mod}</td>
                    <td className="py-2">{remainder as string}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {keyFragment.completed && (
        <>
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Key className="h-4 w-4 mr-1" />
              Recovered Private Key (hex)
            </h3>
            <div className="bg-crypto-background rounded-md p-4 font-mono text-xs break-all">
              {keyFragment.combined_fragments || "No private key data available"}
            </div>
            
            {keyVerificationStatus !== null && (
              <div className={`mt-2 p-2 rounded ${keyVerificationStatus ? 'bg-green-500/10' : 'bg-amber-500/10'} flex items-center`}>
                {keyVerificationStatus ? (
                  <>
                    <CheckCircle2 className={`h-4 w-4 mr-2 text-green-500`} />
                    <span className="text-xs text-green-500">
                      Public key regeneration successful - private key verified
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className={`h-4 w-4 mr-2 text-amber-500`} />
                    <span className="text-xs text-amber-500">
                      Verification failed - generated public key doesn't match original
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          
          {totalInputValue > 0 && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-md">
              <h3 className="text-sm font-medium flex items-center mb-3 text-green-500">
                <DollarSign className="h-4 w-4 mr-1" />
                Recoverable Funds
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-crypto-background p-3 rounded flex items-center justify-between">
                  <span className="text-sm">Bitcoin Value:</span>
                  <div className="flex items-center">
                    <Bitcoin className="h-4 w-4 text-amber-400 mr-1" />
                    <span className="font-mono">{formatBtcValue(totalInputValue)} BTC</span>
                  </div>
                </div>
                <div className="bg-crypto-background p-3 rounded flex items-center justify-between">
                  <span className="text-sm">USD Value:</span>
                  <span className="font-mono">{formatUsdValue(totalInputValue)}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
