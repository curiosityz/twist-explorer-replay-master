
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, Copy, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnalysisResult } from '@/types';
import { toast } from 'sonner';

interface AnalysisResultDisplayProps {
  analysisResult: AnalysisResult;
  privateKey: string | null;
  verificationResult: boolean | null;
  isDuplicate: boolean;
  copyPrivateKey: () => void;
  copied: boolean;
}

const AnalysisResultDisplay: React.FC<AnalysisResultDisplayProps> = ({
  analysisResult,
  privateKey,
  verificationResult,
  isDuplicate,
  copyPrivateKey,
  copied
}) => {
  return (
    <div className="space-y-4">
      <div className={`${isDuplicate ? 'bg-blue-500/10 border-blue-500/20' : 'bg-amber-500/10 border-amber-500/20'} border rounded-md p-3`}>
        <div className={`font-medium ${isDuplicate ? 'text-blue-500' : 'text-amber-500'}`}>
          {isDuplicate ? 'DUPLICATE TRANSACTION' : `${analysisResult.vulnerabilityType.replace('_', ' ').toUpperCase()} DETECTED`}
        </div>
        <p className="text-sm mt-1">
          {isDuplicate 
            ? "This transaction has already been analyzed and its key fragments extracted."
            : analysisResult.message}
        </p>
      </div>
      
      <div className="space-y-2">
        <div className="text-xs font-medium text-crypto-foreground/70">
          ECDSA Public Key (Not on Curve)
        </div>
        <div className="bg-crypto-background p-2 rounded">
          <div className="text-xs font-mono">
            <div>x: {analysisResult.publicKey.x}</div>
            <div>y: {analysisResult.publicKey.y}</div>
          </div>
        </div>
      </div>
      
      {analysisResult.primeFactors && analysisResult.primeFactors.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-crypto-foreground/70">
            Prime Factors of Twist Order
          </div>
          <div className="bg-crypto-background p-2 rounded">
            <div className="text-xs font-mono">
              {analysisResult.primeFactors.join(', ')}
            </div>
          </div>
        </div>
      )}
      
      {analysisResult.privateKeyModulo && Object.keys(analysisResult.privateKeyModulo).length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-crypto-foreground/70">
            Private Key Fragments
          </div>
          <div className="bg-crypto-background p-2 rounded">
            <table className="text-xs font-mono w-full">
              <thead>
                <tr className="text-crypto-foreground/60">
                  <th className="text-left w-1/2">Modulus</th>
                  <th className="text-left w-1/2">Remainder</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analysisResult.privateKeyModulo).map(([mod, rem], i) => (
                  <tr key={i}>
                    <td>{mod}</td>
                    <td>{rem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-green-500 flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            {Object.keys(analysisResult.privateKeyModulo).length >= 6
              ? 'All congruences recovered - full private key reconstruction possible!'
              : `${Object.keys(analysisResult.privateKeyModulo).length}/6 fragments recovered - partial key information`}
          </div>
          
          {Object.keys(analysisResult.privateKeyModulo).length >= 6 && privateKey && (
            <div className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm text-green-500 flex items-center">
                  <Check className="h-4 w-4 mr-1" />
                  Recovered Private Key
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={copyPrivateKey}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <div className="font-mono text-xs mt-1 break-all">
                {privateKey}
              </div>
              
              {verificationResult !== null && (
                <div className={`mt-2 text-xs ${verificationResult ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                  {verificationResult ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Private key verified - successfully regenerates public key
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Key verification failed - does not match public key
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisResultDisplay;
