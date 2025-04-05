import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalysisResult, CryptographicPoint } from '@/types';
import { MOCK_ANALYSIS_RESULT } from '@/lib/mockVulnerabilities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { combinePrivateKeyFragments } from '@/lib/cryptoUtils';
import { useToast } from '@/hooks/use-toast';

interface CryptographicVisualizerProps {
  txid?: string;
  startAnalysis?: boolean;
}

const CryptographicVisualizer = ({ 
  txid, 
  startAnalysis = false 
}: CryptographicVisualizerProps) => {
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'completed' | 'failed'>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [combiningKeys, setCombiningKeys] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (startAnalysis && txid) {
      setAnalysisStatus('analyzing');
      setProgress(0);
      setResult(null);
      
      const fetchExistingAnalysis = async () => {
        const { data, error } = await supabase
          .from('vulnerability_analyses')
          .select('*')
          .eq('txid', txid)
          .single();
          
        if (data && !error) {
          const analysisResult: AnalysisResult = {
            txid: data.txid,
            vulnerabilityType: data.vulnerability_type,
            publicKey: data.public_key as CryptographicPoint,
            signature: data.signature,
            twistOrder: data.twist_order,
            primeFactors: data.prime_factors,
            privateKeyModulo: data.private_key_modulo,
            status: data.status as 'pending' | 'analyzing' | 'completed' | 'failed',
            message: data.message
          };
          
          setResult(analysisResult);
          setAnalysisStatus(analysisResult.status);
          setProgress(100);
          
          if (analysisResult.publicKey && analysisResult.privateKeyModulo) {
            checkAndCombineKeyFragments(analysisResult);
          }
          
          return true;
        }
        
        return false;
      };
      
      const performNewAnalysis = async () => {
        const interval = setInterval(() => {
          setProgress(prev => {
            const newProgress = prev + Math.random() * 5;
            if (newProgress >= 100) {
              clearInterval(interval);
              completeAnalysis();
              return 100;
            }
            return newProgress;
          });
        }, 200);
        
        return () => clearInterval(interval);
      };
      
      const completeAnalysis = async () => {
        const mockResult: AnalysisResult = { ...MOCK_ANALYSIS_RESULT };
        mockResult.txid = txid;
        
        setAnalysisStatus('completed');
        setResult(mockResult);
        
        await supabase.from('vulnerability_analyses').upsert({
          txid: mockResult.txid,
          vulnerability_type: mockResult.vulnerabilityType,
          public_key: mockResult.publicKey,
          signature: mockResult.signature,
          twist_order: mockResult.twistOrder,
          prime_factors: mockResult.primeFactors,
          private_key_modulo: mockResult.privateKeyModulo,
          status: mockResult.status,
          message: mockResult.message
        }, { onConflict: 'txid' });
        
        if (mockResult.publicKey && mockResult.privateKeyModulo) {
          checkAndCombineKeyFragments(mockResult);
        }
      };
      
      fetchExistingAnalysis().then(exists => {
        if (!exists) {
          performNewAnalysis();
        }
      });
    }
  }, [startAnalysis, txid]);
  
  const checkAndCombineKeyFragments = async (currentAnalysis: AnalysisResult) => {
    if (!currentAnalysis.publicKey || !currentAnalysis.privateKeyModulo) return;
    
    setCombiningKeys(true);
    
    const pubKeyHex = `${currentAnalysis.publicKey.x}${currentAnalysis.publicKey.y}`;
    
    try {
      const { data: existingFragment } = await supabase
        .from('private_key_fragments')
        .select('*')
        .eq('public_key_hex', pubKeyHex)
        .single();
      
      if (existingFragment) {
        const updatedModuloValues = {
          ...existingFragment.modulo_values,
          ...currentAnalysis.privateKeyModulo
        };
        
        const combinedKey = combinePrivateKeyFragments(updatedModuloValues);
        
        await supabase
          .from('private_key_fragments')
          .update({
            modulo_values: updatedModuloValues,
            combined_fragments: combinedKey,
            completed: !!combinedKey
          })
          .eq('id', existingFragment.id);
        
        if (combinedKey && !existingFragment.combined_fragments) {
          toast({
            title: "Private Key Fragments Combined!",
            description: "Multiple fragments were successfully combined into a partial private key.",
            variant: "default"
          });
        }
      } else {
        await supabase
          .from('private_key_fragments')
          .insert({
            public_key_hex: pubKeyHex,
            modulo_values: currentAnalysis.privateKeyModulo,
            combined_fragments: null,
            completed: false
          });
      }
    } catch (error) {
      console.error("Error handling key fragments:", error);
    } finally {
      setCombiningKeys(false);
    }
  };

  const renderStatusIndicator = () => {
    switch(analysisStatus) {
      case 'analyzing':
        return (
          <div className="flex items-center space-x-2 text-yellow-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Analysis in progress... ({Math.floor(progress)}%)</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center space-x-2 text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>Analysis complete</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span>Analysis failed</span>
          </div>
        );
      default:
        return (
          <div className="text-crypto-foreground/60">
            Start transaction analysis to see results
          </div>
        );
    }
  };

  const MatrixBackground = () => (
    <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none z-0">
      <div className="grid-matrix w-full h-full"></div>
      {Array.from({ length: 15 }).map((_, i) => (
        <div 
          key={i} 
          className="absolute text-crypto-primary font-mono text-xs top-0 whitespace-nowrap animate-matrix-fall"
          style={{ 
            left: `${Math.random() * 100}%`, 
            animationDuration: `${10 + Math.random() * 20}s`,
            animationDelay: `${Math.random() * 5}s`
          }}
        >
          {Array.from({ length: 20 }).map(() => 
            String.fromCharCode(0x30A0 + Math.random() * 96)
          ).join('')}
        </div>
      ))}
    </div>
  );

  return (
    <Card className="bg-crypto-muted border-crypto-border h-full overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-crypto-foreground">Vulnerability Analysis</CardTitle>
          <Badge variant="outline" className="bg-crypto-background border-crypto-border">
            {result?.vulnerabilityType || 'No Analysis'}
          </Badge>
        </div>
        <CardDescription className="text-crypto-foreground/70">
          {renderStatusIndicator()}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative p-0">
        <MatrixBackground />

        {analysisStatus === 'idle' && (
          <div className="flex flex-col items-center justify-center p-8 h-[350px]">
            <div className="text-crypto-foreground/40 text-center space-y-2">
              <div className="border-2 border-dashed border-crypto-foreground/20 rounded-lg h-32 w-32 flex items-center justify-center mb-4">
                <span className="text-5xl">⚡</span>
              </div>
              <p>Select a transaction and start analysis</p>
              <p className="text-xs">The tool will extract cryptographic data and check for vulnerabilities</p>
            </div>
          </div>
        )}

        {analysisStatus === 'analyzing' && (
          <div className="p-6 space-y-6">
            <div className="relative h-2 bg-crypto-background rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-crypto-primary to-crypto-accent"
                style={{ width: `${progress}%`, transition: 'width 0.3s ease-in-out' }}
              ></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-crypto-background p-4 rounded border border-crypto-border">
                <h4 className="text-xs font-medium text-crypto-primary mb-2">Extracting Public Key</h4>
                <div className="space-y-1 text-xs font-mono">
                  {progress > 10 && <div>Decoding transaction...</div>}
                  {progress > 25 && <div>Extracting input scripts...</div>}
                  {progress > 40 && <div>Found public key candidate...</div>}
                  {progress > 50 && <div>Verifying curve point...</div>}
                </div>
              </div>
              
              <div className="bg-crypto-background p-4 rounded border border-crypto-border">
                <h4 className="text-xs font-medium text-crypto-primary mb-2">Signature Analysis</h4>
                <div className="space-y-1 text-xs font-mono">
                  {progress > 30 && <div>Extracting DER signature...</div>}
                  {progress > 55 && <div>Parsing r,s values...</div>}
                  {progress > 70 && <div>Computing message hash...</div>}
                  {progress > 85 && <div>Verifying signature...</div>}
                </div>
              </div>
            </div>
            
            {progress > 60 && (
              <div className="bg-crypto-background p-4 rounded border border-crypto-border">
                <h4 className="text-xs font-medium text-crypto-primary mb-2">Vulnerability Detection</h4>
                <div className="space-y-1 text-xs font-mono">
                  {progress > 65 && <div>Point is NOT on secp256k1 curve...</div>}
                  {progress > 75 && <div>Computing twist parameters...</div>}
                  {progress > 85 && <div>Finding order of twisted curve...</div>}
                  {progress > 95 && <div>Factoring order into primes...</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {analysisStatus === 'completed' && result && (
          <Tabs defaultValue="summary" className="w-full">
            <div className="px-6 pt-2">
              <TabsList className="bg-crypto-background w-full">
                <TabsTrigger value="summary" className="flex-1 data-[state=active]:bg-crypto-primary/20">Summary</TabsTrigger>
                <TabsTrigger value="pubkey" className="flex-1 data-[state=active]:bg-crypto-primary/20">Public Key</TabsTrigger>
                <TabsTrigger value="signature" className="flex-1 data-[state=active]:bg-crypto-primary/20">Signature</TabsTrigger>
                <TabsTrigger value="privatekey" className="flex-1 data-[state=active]:bg-crypto-primary/20">Private Key</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6 max-h-[300px] overflow-auto terminal-text text-xs">
              <TabsContent value="summary" className="mt-0 space-y-4">
                <div className="bg-crypto-background p-4 rounded border border-crypto-border">
                  <h4 className="font-medium text-crypto-primary mb-2">Vulnerability Analysis</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="text-crypto-foreground/70">Vulnerability:</div>
                    <div>{result.vulnerabilityType}</div>
                    <div className="text-crypto-foreground/70">Status:</div>
                    <div className="text-green-400">{result.status}</div>
                    <div className="text-crypto-foreground/70">Transaction:</div>
                    <div className="break-all">{result.txid}</div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-crypto-border">
                    <div className="text-crypto-foreground/70">Summary:</div>
                    <p className="mt-1">{result.message}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="pubkey" className="mt-0 space-y-4">
                <div className="bg-crypto-background p-4 rounded border border-crypto-border">
                  <h4 className="font-medium text-crypto-primary mb-2">Public Key Analysis</h4>
                  <div className="grid grid-cols-1 gap-y-1">
                    <div className="text-crypto-foreground/70">Is On Curve:</div>
                    <div className={result.publicKey.isOnCurve ? "text-green-400" : "text-red-400"}>
                      {result.publicKey.isOnCurve ? "Yes (secp256k1)" : "No (not on secp256k1)"}
                    </div>
                    <div className="text-crypto-foreground/70 mt-2">X Coordinate:</div>
                    <div className="break-all bg-crypto-muted p-1 rounded">
                      {result.publicKey.x}
                    </div>
                    <div className="text-crypto-foreground/70 mt-2">Y Coordinate:</div>
                    <div className="break-all bg-crypto-muted p-1 rounded">
                      {result.publicKey.y}
                    </div>
                    <div className="text-crypto-foreground/70 mt-2">Twist Order:</div>
                    <div className="break-all bg-crypto-muted p-1 rounded">
                      {result.twistOrder}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="signature" className="mt-0 space-y-4">
                {result.signature && (
                  <div className="bg-crypto-background p-4 rounded border border-crypto-border">
                    <h4 className="font-medium text-crypto-primary mb-2">ECDSA Signature Components</h4>
                    <div className="grid grid-cols-1 gap-y-1">
                      <div className="text-crypto-foreground/70">r value:</div>
                      <div className="break-all bg-crypto-muted p-1 rounded">
                        {result.signature.r}
                      </div>
                      <div className="text-crypto-foreground/70 mt-2">s value:</div>
                      <div className="break-all bg-crypto-muted p-1 rounded">
                        {result.signature.s}
                      </div>
                      <div className="text-crypto-foreground/70 mt-2">Message Hash (sighash):</div>
                      <div className="break-all bg-crypto-muted p-1 rounded">
                        {result.signature.sighash}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="privatekey" className="mt-0 space-y-4">
                <div className="bg-crypto-background p-4 rounded border border-crypto-border">
                  <h4 className="font-medium text-crypto-primary mb-2">Private Key Recovery (Partial)</h4>
                  
                  {result.primeFactors && (
                    <div className="mb-4">
                      <div className="text-crypto-foreground/70 mb-1">Prime Factors of Twist Order:</div>
                      <div className="flex flex-wrap gap-2">
                        {result.primeFactors.map((factor, idx) => (
                          <Badge key={idx} variant="outline" className="bg-crypto-muted">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {result.privateKeyModulo && (
                    <div>
                      <div className="text-crypto-foreground/70 mb-1">Private Key Modulo Small Primes:</div>
                      <div className="space-y-2">
                        {Object.entries(result.privateKeyModulo).map(([prime, value], idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-crypto-muted p-1 rounded">
                            <span>d ≡ {value} (mod {prime})</span>
                          </div>
                        ))}
                      </div>
                      
                      {combiningKeys && (
                        <div className="mt-2 flex items-center gap-2 text-yellow-400">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Checking for other key fragments...</span>
                        </div>
                      )}
                      
                      <div className="mt-4 p-2 border border-dashed border-crypto-primary/30 rounded">
                        <p className="text-xs">
                          Using the Chinese Remainder Theorem, these modular values can be combined to
                          partially recover the private key, allowing spending of funds from vulnerable addresses.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default CryptographicVisualizer;
