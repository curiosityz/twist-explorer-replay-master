
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, FileCode, FileSearch, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { isPointOnSecp256k1Curve } from '@/lib/cryptoUtils';

interface RawDataTabProps {
  transaction: any;
  analysis: any;
}

export function RawDataTab({ transaction, analysis }: RawDataTabProps) {
  const [publicKeyOnCurve, setPublicKeyOnCurve] = useState<boolean | null>(null);
  
  // Use the library to check if public key is on curve when analysis data is available
  useEffect(() => {
    if (analysis?.public_key?.x && analysis?.public_key?.y) {
      try {
        const isOnCurve = isPointOnSecp256k1Curve(analysis.public_key.x, analysis.public_key.y);
        setPublicKeyOnCurve(isOnCurve);
      } catch (error) {
        console.error("Error checking if point is on curve:", error);
        setPublicKeyOnCurve(null);
      }
    }
  }, [analysis]);

  return (
    <>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Transaction Data</h3>
        
        <Collapsible className="w-full">
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-crypto-background p-4 font-medium">
            Raw Transaction JSON
            <ChevronDown className="h-4 w-4 transition-transform duration-200 collapsible-open:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 rounded-md bg-crypto-background p-4 font-mono text-xs overflow-auto max-h-[400px]">
              <pre>{transaction ? JSON.stringify(
                typeof transaction.decoded_json === 'string' 
                  ? JSON.parse(transaction.decoded_json) 
                  : transaction.decoded_json, 
                null, 2
              ) : 'No data'}</pre>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
      
      {transaction?.raw_hex && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Raw Transaction Hex</h3>
          <div className="bg-crypto-background rounded-md p-4 font-mono text-xs overflow-auto max-h-[200px]">
            {transaction.raw_hex}
          </div>
        </div>
      )}
      
      {analysis && (
        <>
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              Public Key Data
              {publicKeyOnCurve !== null && (
                <Badge 
                  variant={publicKeyOnCurve ? "outline" : "destructive"}
                  className="ml-2"
                >
                  {publicKeyOnCurve ? "On Curve" : "Off Curve"}
                </Badge>
              )}
            </h3>
            
            {analysis.public_key && (
              <div className="bg-crypto-background rounded-md p-4 font-mono text-xs overflow-auto max-h-[200px]">
                <div><span className="text-crypto-accent">X:</span> {analysis.public_key.x}</div>
                <div><span className="text-crypto-accent">Y:</span> {analysis.public_key.y}</div>
                
                {!publicKeyOnCurve && publicKeyOnCurve !== null && (
                  <div className="mt-2 flex items-center text-red-400">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    This point is not on the secp256k1 curve!
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Raw Analysis Data</h3>
            <Collapsible className="w-full">
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-crypto-background p-4 font-medium">
                Analysis JSON
                <ChevronDown className="h-4 w-4 transition-transform duration-200 collapsible-open:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 rounded-md bg-crypto-background p-4 font-mono text-xs overflow-auto max-h-[400px]">
                  <pre>{JSON.stringify(analysis, null, 2)}</pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </>
      )}
    </>
  );
}
