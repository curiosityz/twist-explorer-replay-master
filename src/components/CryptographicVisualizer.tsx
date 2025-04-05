
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase, Tables } from '@/integrations/supabase/client';
import { Cpu, Loader2, Lock, RefreshCw, XCircle, Check } from 'lucide-react';
import { AnalysisResult, CryptographicPoint, Signature } from '@/types';
import { combinePrivateKeyFragments, normalizePrivateKey, verifyPrivateKey } from '@/lib/cryptoUtils';

interface CryptographicVisualizerProps {
  txid?: string;
  startAnalysis?: boolean;
}

const CryptographicVisualizer = ({ txid, startAnalysis = false }: CryptographicVisualizerProps) => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);

  // This effect runs when the component mounts or when txid/startAnalysis changes
  useEffect(() => {
    if (txid && startAnalysis) {
      handleAnalyzeTransaction();
    }
  }, [txid, startAnalysis]);

  const handleAnalyzeTransaction = async () => {
    if (!txid) return;

    setIsAnalyzing(true);
    setError(null);
    setVerificationResult(null);

    try {
      // First, check if transaction exists in database
      const { data: txData, error: txError } = await supabase
        .from(Tables.blockchain_transactions)
        .select('*')
        .eq('txid', txid)
        .maybeSingle();
        
      if (txError) {
        console.error("Error checking transaction existence:", txError);
        throw new Error("Failed to check if transaction exists");
      }
      
      if (!txData) {
        console.error("Transaction not found in database");
        throw new Error("Transaction not found in database");
      }

      // Simulate analysis delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock analysis result
      const mockPublicKey: CryptographicPoint = {
        x: '0xa2e678b5d8ae35ae5125b83e7a0d8d843664b3abc98709048453b0a516e5d589',
        y: '0x5c6e2e5eace8de16b686baaeb92d3e4d0fb5692834fff8248517f584e47170b6',
        isOnCurve: false
      };

      const mockSignature: Signature = {
        r: '0x2a298dacae57395a15d0795ddbfd1dcb564da82b0f269bc70a74f8220429ba1c',
        s: '0x1c8fae3c66a687625e73a38d71b7fa63cef2b56acf42e7b149d5e6fd46f1ea76',
        sighash: '0x01'
      };

      // Generate random prime factors and modulo values
      const mockPrimeFactors = ['101', '103', '107', '109', '113', '127', '131', '137'];
      const mockPrivateKeyModulo: Record<string, string> = {
        '101': '45',
        '103': '67',
        '107': '89',
        '109': '94',
        '113': '51',
        '127': '83',
        '131': '112',
        '137': '59'
      };

      const mockAnalysisResult: AnalysisResult = {
        txid,
        vulnerabilityType: 'twisted_curve',
        publicKey: mockPublicKey,
        signature: mockSignature,
        twistOrder: '14350669539884012975',
        primeFactors: mockPrimeFactors,
        privateKeyModulo: mockPrivateKeyModulo,
        status: 'completed',
        message: 'Successfully identified Twisted Curve vulnerability and extracted private key fragments via Chinese Remainder Theorem'
      };

      setAnalysisResult(mockAnalysisResult);

      // Save the analysis to the database
      try {
        // First check if an analysis already exists for this txid
        const { data: existingAnalysis, error: checkError } = await supabase
          .from(Tables.vulnerability_analyses)
          .select('id')
          .eq('txid', txid)
          .maybeSingle();
          
        if (checkError) {
          console.error("Error checking existing analysis:", checkError);
        }
        
        // Format the data for insertion/update - convert objects to JSON for Supabase
        const analysisData = {
          txid: mockAnalysisResult.txid,
          vulnerability_type: mockAnalysisResult.vulnerabilityType,
          public_key: mockPublicKey as unknown as JSON, // Cast to JSON for Supabase
          signature: mockSignature as unknown as JSON,
          prime_factors: mockPrimeFactors as unknown as JSON,
          private_key_modulo: mockPrivateKeyModulo as unknown as JSON,
          twist_order: mockAnalysisResult.twistOrder,
          status: mockAnalysisResult.status,
          message: mockAnalysisResult.message
        };
          
        if (existingAnalysis) {
          // Update existing analysis
          const { error: updateError } = await supabase
            .from(Tables.vulnerability_analyses)
            .update(analysisData)
            .eq('id', existingAnalysis.id);
            
          if (updateError) {
            console.error("Error updating analysis:", updateError);
          }
        } else {
          // Insert new analysis
          const { error: insertError } = await supabase
            .from(Tables.vulnerability_analyses)
            .insert(analysisData);
            
          if (insertError) {
            console.error("Error saving analysis:", insertError);
          }
        }
        
        // Also try to save the key fragments
        const publicKeyHex = mockPublicKey.x + mockPublicKey.y;
        
        const { data: existingFragment, error: fragmentCheckError } = await supabase
          .from(Tables.private_key_fragments)
          .select('*')
          .eq('public_key_hex', publicKeyHex)
          .maybeSingle();
          
        if (fragmentCheckError) {
          console.error("Error checking key fragments:", fragmentCheckError);
        }
        
        // Calculate combined fragment based on CRT
        const combinedFragment = combinePrivateKeyFragments(mockPrivateKeyModulo);
        const isComplete = Object.keys(mockPrivateKeyModulo).length >= 6;
        
        // Verify the private key if it was successfully recovered
        let isKeyVerified = false;
        if (combinedFragment && isComplete) {
          isKeyVerified = verifyPrivateKey(combinedFragment, mockPublicKey.x, mockPublicKey.y);
          setVerificationResult(isKeyVerified);
        }
        
        if (existingFragment) {
          // Update existing fragments
          const { error: updateFragError } = await supabase
            .from(Tables.private_key_fragments)
            .update({
              modulo_values: mockPrivateKeyModulo as unknown as JSON,
              combined_fragments: isComplete ? combinedFragment : existingFragment.combined_fragments,
              completed: isComplete
            })
            .eq('public_key_hex', publicKeyHex);
            
          if (updateFragError) {
            console.error("Error updating key fragments:", updateFragError);
          }
        } else {
          // Insert new fragments
          const { error: insertFragError } = await supabase
            .from(Tables.private_key_fragments)
            .insert({
              public_key_hex: publicKeyHex,
              modulo_values: mockPrivateKeyModulo as unknown as JSON,
              combined_fragments: isComplete ? combinedFragment : null,
              completed: isComplete
            });
            
          if (insertFragError) {
            console.error("Error saving key fragments:", insertFragError);
          }
        }
        
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
      
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      
      // Still save the failed analysis to the database
      if (txid) {
        try {
          const failedAnalysis = {
            txid: txid,
            vulnerability_type: 'unknown',
            public_key: { x: '0x0', y: '0x0', isOnCurve: false } as unknown as JSON,
            status: 'failed',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
          };
          
          const { error: saveError } = await supabase
            .from(Tables.vulnerability_analyses)
            .upsert(failedAnalysis);
            
          if (saveError) {
            console.error("Error saving failed analysis:", saveError);
          }
        } catch (dbError) {
          console.error('Database error while saving failed analysis:', dbError);
        }
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!txid) {
    return (
      <Card className="bg-crypto-muted border-crypto-border h-full">
        <CardHeader>
          <CardTitle className="text-crypto-foreground">Cryptographic Analysis</CardTitle>
          <CardDescription className="text-crypto-foreground/70">
            Select a transaction to analyze
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[280px]">
          <div className="text-center text-crypto-foreground/60">
            <Lock className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p>Fetch a transaction to begin analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isAnalyzing) {
    return (
      <Card className="bg-crypto-muted border-crypto-border h-full">
        <CardHeader>
          <CardTitle className="text-crypto-foreground">Analyzing Transaction</CardTitle>
          <CardDescription className="text-crypto-foreground/70">
            Scanning for cryptographic vulnerabilities...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[280px]">
          <Loader2 className="h-16 w-16 animate-spin text-crypto-primary mb-4" />
          <p className="text-crypto-foreground/70 text-center">
            Computing modular congruences and applying Chinese Remainder Theorem...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-crypto-muted border-crypto-border h-full">
        <CardHeader>
          <CardTitle className="text-crypto-foreground">Analysis Failed</CardTitle>
          <CardDescription className="text-crypto-foreground/70">
            TXID: {txid.substring(0, 8)}...{txid.substring(txid.length - 8)}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] overflow-auto">
          <div className="flex flex-col items-center justify-center h-full">
            <XCircle className="h-16 w-16 text-red-500 mb-4" />
            <p className="text-red-500 font-medium mb-2">Analysis Error</p>
            <p className="text-center text-crypto-foreground/70">{error}</p>
            <Button 
              onClick={handleAnalyzeTransaction}
              className="mt-6 bg-crypto-primary hover:bg-crypto-primary/80"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-crypto-muted border-crypto-border h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-crypto-foreground">Vulnerability Results</CardTitle>
            <CardDescription className="text-crypto-foreground/70">
              TXID: {txid.substring(0, 8)}...{txid.substring(txid.length - 8)}
            </CardDescription>
          </div>
          {analysisResult && (
            <Badge 
              variant={analysisResult.status === 'completed' ? 'default' : 'destructive'} 
              className="ml-auto"
            >
              {analysisResult.status}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="h-[280px] overflow-auto">
        {analysisResult ? (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
              <div className="font-medium text-amber-500">
                {analysisResult.vulnerabilityType.replace('_', ' ').toUpperCase()} DETECTED
              </div>
              <p className="text-sm mt-1">{analysisResult.message}</p>
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
            
            {analysisResult.privateKeyModulo && (
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
                
                {Object.keys(analysisResult.privateKeyModulo).length >= 6 && (
                  <div className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded">
                    <div className="font-medium text-sm text-green-500 flex items-center">
                      <Check className="h-4 w-4 mr-1" />
                      Recovered Private Key
                    </div>
                    <div className="font-mono text-xs mt-1 break-all">
                      {combinePrivateKeyFragments(analysisResult.privateKeyModulo)}
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
                            <XCircle className="h-3 w-3 mr-1" />
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
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <Button 
              onClick={handleAnalyzeTransaction}
              className="bg-crypto-accent hover:bg-crypto-accent/80"
            >
              <Cpu className="mr-2 h-4 w-4" />
              Start Vulnerability Analysis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CryptographicVisualizer;
