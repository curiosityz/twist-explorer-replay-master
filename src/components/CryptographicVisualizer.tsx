
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CryptographicPoint, Signature, AnalysisResult } from '@/types';
import { Progress } from '@/components/ui/progress';
import { Loader2, Check, AlertCircle, Key, Lock, Unlock } from 'lucide-react';
import { combinePrivateKeyFragments } from '@/lib/cryptoUtils';
import { supabase, Tables } from '@/integrations/supabase/client';

interface CryptographicVisualizerProps {
  txid?: string;
  startAnalysis?: boolean;
}

const CryptographicVisualizer = ({ txid, startAnalysis = false }: CryptographicVisualizerProps) => {
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'completed' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    // Check if we already have an analysis for this transaction
    const fetchExistingAnalysis = async () => {
      if (!txid) return;
      
      try {
        const { data, error } = await supabase
          .from(Tables.vulnerability_analyses)
          .select('*')
          .eq('txid', txid)
          .single();
          
        if (data && !error) {
          // Type casting to ensure we convert the JSON data to proper types
          const publicKey = data.public_key as unknown as CryptographicPoint;
          const signature = data.signature as unknown as Signature | undefined;
          const primeFactors = Array.isArray(data.prime_factors) ? data.prime_factors as string[] : undefined;
          const privateKeyModulo = data.private_key_modulo as Record<string, string> | undefined;
          
          const result: AnalysisResult = {
            txid: data.txid,
            vulnerabilityType: data.vulnerability_type,
            publicKey: publicKey,
            signature: signature,
            twistOrder: data.twist_order || undefined,
            primeFactors: primeFactors,
            privateKeyModulo: privateKeyModulo,
            status: data.status as 'pending' | 'analyzing' | 'completed' | 'failed',
            message: data.message || undefined,
          };
          
          setAnalysisResult(result);
          setStatus(data.status as 'analyzing' | 'completed' | 'failed');
        } else {
          setAnalysisResult(null);
          setStatus('idle');
        }
      } catch (error) {
        console.error('Error fetching analysis:', error);
        setAnalysisResult(null);
        setStatus('idle');
      }
    };
    
    fetchExistingAnalysis();
  }, [txid]);
  
  useEffect(() => {
    // Start analysis if requested
    const runAnalysis = async () => {
      if (!txid || !startAnalysis || status !== 'idle') return;
      
      try {
        setStatus('analyzing');
        setProgress(0);
        
        // Create mock analysis result with more realistic prime factors
        const mockPublicKey: CryptographicPoint = {
          x: '0xa2e678b5d8ae35ae5125b83e7a0d8d843664b3abc98709048453b0a516e5d589',
          y: '0x5c6e2e5eace8de16b686baaeb92d3e4d0fb5692834fff8248517f584e47170b6',
          isOnCurve: false
        };
        
        const mockSignature: Signature = {
          r: '0x123abc',
          s: '0x456def',
          sighash: '0x789fed'
        };
        
        // Generate more prime factors for more robust CRT calculations
        const primesArray = ['0x101', '0x103', '0x107', '0x10d', '0x10f', '0x111'];
        
        // Generate private key modulo values for all prime factors
        const privateKeyMods: Record<string, string> = {};
        primesArray.forEach((prime, index) => {
          // Simulating different remainders for each modulo
          privateKeyMods[prime] = `0x${(0x45 + index * 10).toString(16)}`;
        });
        
        // Create the full analysis result
        const mockResult: AnalysisResult = {
          txid: txid,
          vulnerabilityType: 'twisted_curve',
          publicKey: mockPublicKey,
          signature: mockSignature,
          status: 'completed',
          message: 'Vulnerability identified: Public key not on secp256k1 curve. Successfully calculated private key modulo values.',
          twistOrder: '0x6f8a80d37d1f8161d5385fda1672e4bfbb7276ea83c9b330b8c216e94dbdca83',
          primeFactors: primesArray,
          privateKeyModulo: privateKeyMods
        };
        
        // Simulate progress
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 300);
        
        // Save analysis to database - use upsert with proper structure
        const { error } = await supabase
          .from(Tables.vulnerability_analyses)
          .upsert({
            txid: mockResult.txid,
            vulnerability_type: mockResult.vulnerabilityType,
            public_key: mockResult.publicKey,
            signature: mockResult.signature,
            twist_order: mockResult.twistOrder,
            prime_factors: mockResult.primeFactors,
            private_key_modulo: mockResult.privateKeyModulo,
            status: mockResult.status,
            message: mockResult.message
          });
          
        if (error) {
          console.error('Error saving analysis:', error);
          setStatus('failed');
          return;
        }
        
        // Check if we have existing private key fragments for this public key
        await checkAndCombineKeyFragments(mockResult.publicKey, mockResult.privateKeyModulo);
        
        setAnalysisResult(mockResult);
        setStatus('completed');
      } catch (error) {
        console.error('Error during analysis:', error);
        setStatus('failed');
      }
    };
    
    runAnalysis();
  }, [txid, startAnalysis, status]);
  
  // Function to check for and combine key fragments using Chinese Remainder Theorem
  const checkAndCombineKeyFragments = async (
    publicKey: CryptographicPoint, 
    newFragments: Record<string, string> | undefined
  ) => {
    if (!newFragments) return;
    
    const publicKeyHex = publicKey.x + publicKey.y;
    
    try {
      // Check for existing fragments
      const { data: existingData, error: fetchError } = await supabase
        .from(Tables.private_key_fragments)
        .select('*')
        .eq('public_key_hex', publicKeyHex)
        .maybeSingle();
        
      let allFragments = { ...newFragments };
      let isComplete = false;
      let combinedKey: string | null = null;
      
      if (existingData && !fetchError) {
        // Combine with existing fragments
        allFragments = { 
          ...existingData.modulo_values as Record<string, string>, 
          ...newFragments 
        };
        
        // Try to combine all fragments using Chinese Remainder Theorem
        combinedKey = combinePrivateKeyFragments(allFragments);
        isComplete = !!combinedKey;
        
        // Update with new combined key
        await supabase
          .from(Tables.private_key_fragments)
          .update({
            modulo_values: allFragments,
            combined_fragments: combinedKey,
            completed: isComplete
          })
          .eq('id', existingData.id);
          
        if (combinedKey) {
          console.log('Private key recovered!', combinedKey);
          
          // Update analysis message to reflect key recovery status
          const keyRecoveryMessage = isComplete 
            ? `Private key successfully recovered: ${combinedKey}`
            : `Partial key recovery: Private key determined modulo ${Object.keys(allFragments).length} factors`;
            
          await supabase
            .from(Tables.vulnerability_analyses)
            .update({
              message: `Vulnerability identified: Public key not on secp256k1 curve. ${keyRecoveryMessage}`
            })
            .eq('txid', publicKey.x);
        }
      } else {
        // Create new fragment record
        // Try to combine fragments first
        combinedKey = combinePrivateKeyFragments(allFragments);
        isComplete = !!combinedKey;
        
        const { error } = await supabase
          .from(Tables.private_key_fragments)
          .insert({
            public_key_hex: publicKeyHex,
            modulo_values: allFragments,
            combined_fragments: combinedKey,
            completed: isComplete
          });
          
        if (error) {
          console.error('Error saving new key fragments:', error);
        }
      }
    } catch (error) {
      console.error('Error processing key fragments:', error);
    }
  };

  if (!txid) {
    return (
      <Card className="h-full bg-crypto-muted border-crypto-border">
        <CardHeader>
          <CardTitle className="text-crypto-foreground">Cryptographic Analyzer</CardTitle>
          <CardDescription className="text-crypto-foreground/70">
            Select a transaction to analyze for vulnerabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center text-crypto-foreground/50">
            <Lock className="mx-auto h-12 w-12 mb-4" />
            <p>No transaction selected</p>
            <p className="text-xs mt-2">Select a transaction to begin analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-crypto-muted border-crypto-border overflow-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-crypto-foreground">Vulnerability Analysis</CardTitle>
          <Badge 
            variant={status === 'idle' ? "outline" : 
                   status === 'analyzing' ? "secondary" : 
                   status === 'completed' ? "default" : 
                   "destructive"}
            className="font-mono text-xs"
          >
            {status === 'idle' ? 'Ready' : 
             status === 'analyzing' ? 'Analyzing' : 
             status === 'completed' ? 'Vulnerable' : 
             'Failed'}
          </Badge>
        </div>
        <CardDescription className="text-crypto-foreground/70 font-mono text-xs">
          TXID: {txid.substring(0, 10)}...{txid.substring(txid.length - 10)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 pb-6">
        {status === 'analyzing' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-crypto-primary" />
              <span className="text-sm">Analyzing transaction...</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
        
        {status === 'failed' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 text-red-500">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Analysis failed</span>
            </div>
            <p className="mt-2 text-sm">Could not complete vulnerability analysis. The Chinese Remainder Theorem calculation failed to recover the private key. Please try again with a different transaction.</p>
          </div>
        )}
        
        {status === 'completed' && analysisResult && (
          <div className="space-y-6">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-4">
              <h3 className="flex items-center text-amber-400 font-medium mb-2">
                <AlertCircle className="mr-2 h-5 w-5" />
                Vulnerability Detected
              </h3>
              <p className="text-sm text-crypto-foreground/90">
                {analysisResult.message}
              </p>
              <div className="mt-2">
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 font-mono text-xs">
                  {analysisResult.vulnerabilityType}
                </Badge>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2 text-crypto-foreground flex items-center">
                <Key className="mr-2 h-4 w-4" />
                Public Key (Not on Curve)
              </h3>
              <div className="bg-crypto-background rounded-md p-2 font-mono text-xs space-y-1 break-all">
                <div>
                  <span className="text-crypto-accent">x: </span>
                  <span>{analysisResult.publicKey.x}</span>
                </div>
                <div>
                  <span className="text-crypto-accent">y: </span>
                  <span>{analysisResult.publicKey.y}</span>
                </div>
              </div>
            </div>
            
            {analysisResult.primeFactors && analysisResult.primeFactors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 text-crypto-foreground">
                  Twist Order Prime Factors
                </h3>
                <div className="grid grid-cols-2 gap-1 font-mono text-xs">
                  {analysisResult.primeFactors.map((factor, index) => (
                    <div key={index} className="bg-crypto-background rounded p-2">
                      {factor}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {analysisResult.privateKeyModulo && (
              <div>
                <h3 className="text-sm font-medium mb-2 text-crypto-foreground flex items-center">
                  <Unlock className="mr-2 h-4 w-4" />
                  Private Key Fragments (Chinese Remainder Theorem)
                </h3>
                <div className="bg-crypto-background rounded-md p-3 font-mono text-xs">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-crypto-border text-crypto-foreground/60">
                        <th className="pb-2 text-left">Modulus</th>
                        <th className="pb-2 text-left">Remainder</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(analysisResult.privateKeyModulo).map(([mod, remainder], index) => (
                        <tr key={index} className="border-b border-crypto-border/20 last:border-0">
                          <td className="py-2 pr-4">{mod}</td>
                          <td className="py-2">{remainder}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CryptographicVisualizer;
