import { Shield, Unlock, Key, Check, AlertCircle } from 'lucide-react';
import { Bitcoin } from 'lucide-react';
import { CryptographicPoint } from '@/types';
import { formatBtcValue, formatUsdValue } from '@/lib/walletUtils';

interface AnalysisTabProps {
  analysis: any;
  keyFragment: any;
  totalInputValue: number;
  keyVerificationStatus: boolean | null;
}

export function AnalysisTab({ 
  analysis, 
  keyFragment,
  totalInputValue,
  keyVerificationStatus 
}: AnalysisTabProps) {
  if (!analysis) {
    return (
      <div className="text-center py-6 text-crypto-foreground/70">
        No analysis data available for this transaction
      </div>
    );
  }

  // Validate totalInputValue
  if (isNaN(totalInputValue) || totalInputValue < 0) {
    return (
      <div className="text-center py-6 text-crypto-foreground/70">
        Invalid total input value
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Vulnerability Details</h3>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-4">
          <div className="flex items-start">
            <Shield className="text-amber-400 h-5 w-5 mr-2 mt-0.5" />
            <div>
              <h4 className="text-amber-400 font-medium">
                {analysis.vulnerability_type.replace('_', ' ').toUpperCase()}
              </h4>
              <p className="mt-1 text-sm">{analysis.message}</p>
            </div>
          </div>
        </div>
        
        {totalInputValue > 0 && (
          <div className="mt-3 bg-crypto-background/50 border border-crypto-border/40 rounded-md p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Bitcoin className="h-4 w-4 text-amber-400 mr-2" />
                <div className="text-sm">Total Transaction Value:</div>
              </div>
              <div className="font-mono">
                {formatBtcValue(totalInputValue)} BTC
                <span className="text-xs text-crypto-foreground/70 ml-2">
                  (~{formatUsdValue(totalInputValue)})
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {analysis.public_key && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Public Key (Not on Curve)</h3>
          <div className="bg-crypto-background rounded-md p-4 font-mono text-xs space-y-2">
            <div>
              <span className="text-crypto-accent">x: </span>
              <span>{(analysis.public_key as unknown as CryptographicPoint).x}</span>
            </div>
            <div>
              <span className="text-crypto-accent">y: </span>
              <span>{(analysis.public_key as unknown as CryptographicPoint).y}</span>
            </div>
          </div>
        </div>
      )}
      
      {analysis.prime_factors && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Twist Order Prime Factors</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
            {(analysis.prime_factors as string[]).map((factor: string, index: number) => (
              <div key={index} className="bg-crypto-background rounded p-2">
                {factor}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {analysis.private_key_modulo && (
        <div>
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <Unlock className="mr-2 h-4 w-4" />
            Private Key Fragments
          </h3>
          <div className="bg-crypto-background rounded-md p-4 font-mono text-xs">
            <table className="w-full">
              <thead>
                <tr className="border-b border-crypto-border">
                  <th className="pb-2 text-left text-crypto-foreground/70">Modulus</th>
                  <th className="pb-2 text-left text-crypto-foreground/70">Remainder</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analysis.private_key_modulo as Record<string, string>).map(([mod, remainder], index) => (
                  <tr key={index} className="border-b border-crypto-border/20 last:border-0">
                    <td className="py-2 pr-4">{mod}</td>
                    <td className="py-2">{remainder as string}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {keyFragment && keyFragment.completed && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-green-500 font-medium">Private Key Recovered!</span>
                  
                  {keyVerificationStatus !== null && (
                    <span className={`ml-2 text-xs ${keyVerificationStatus ? 'text-green-500' : 'text-amber-500'}`}>
                      {keyVerificationStatus ? '(verified)' : '(verification failed)'}
                    </span>
                  )}
                </div>
                {totalInputValue > 0 && (
                  <div className="flex items-center text-xs">
                    <Bitcoin className="h-3.5 w-3.5 text-amber-400 mr-1" />
                    <span>{formatBtcValue(totalInputValue)} BTC recoverable</span>
                  </div>
                )}
              </div>
              <div className="mt-2 font-mono text-xs break-all">
                {keyFragment.combined_fragments}
              </div>
            </div>
          )}
        </div>
      )}

      {analysis.nonce_reuse && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Nonce Reuse Detected</h3>
          <div className="bg-crypto-background rounded-md p-4 font-mono text-xs space-y-2">
            <div>
              <span className="text-crypto-accent">Nonce Reuse: </span>
              <span>{analysis.nonce_reuse}</span>
            </div>
          </div>
        </div>
      )}

      {analysis.weak_signature && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Weak Signature Detected</h3>
          <div className="bg-crypto-background rounded-md p-4 font-mono text-xs space-y-2">
            <div>
              <span className="text-crypto-accent">Weak Signature: </span>
              <span>{analysis.weak_signature}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
