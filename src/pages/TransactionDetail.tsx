
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase, Tables } from '@/integrations/supabase/client';
import { ArrowLeft, ChevronDown, Eye, FileCode, FileSearch, Key, Lock, RefreshCw, Shield, Unlock, Check, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { CryptographicPoint, Signature } from '@/types';

const TransactionDetail = () => {
  const { txid } = useParams();
  const [transaction, setTransaction] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [keyFragment, setKeyFragment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analysis');
  
  useEffect(() => {
    const fetchData = async () => {
      if (!txid) return;
      
      setLoading(true);
      
      try {
        // Fetch transaction details
        const { data: txData, error: txError } = await supabase
          .from(Tables.blockchain_transactions)
          .select('*')
          .eq('txid', txid)
          .single();
          
        if (txError) {
          console.error('Error fetching transaction:', txError);
        } else {
          setTransaction(txData);
        }
        
        // Fetch analysis details
        const { data: analysisData, error: analysisError } = await supabase
          .from(Tables.vulnerability_analyses)
          .select('*')
          .eq('txid', txid)
          .single();
          
        if (analysisError) {
          console.error('Error fetching analysis:', analysisError);
        } else {
          setAnalysis(analysisData);
          
          // If we have a public key, check for key fragments
          if (analysisData?.public_key) {
            // Safe access with type checking
            const publicKey = analysisData.public_key as unknown as CryptographicPoint;
            const publicKeyHex = publicKey.x + publicKey.y;
            
            const { data: keyData, error: keyError } = await supabase
              .from(Tables.private_key_fragments)
              .select('*')
              .eq('public_key_hex', publicKeyHex)
              .single();
              
            if (!keyError) {
              setKeyFragment(keyData);
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [txid]);
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'analyzing': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-crypto-background text-crypto-foreground p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-crypto-primary" />
          <h2 className="text-xl font-semibold">Loading transaction details...</h2>
        </div>
      </div>
    );
  }
  
  if (!transaction && !analysis) {
    return (
      <div className="min-h-screen bg-crypto-background text-crypto-foreground p-6">
        <header className="mb-8">
          <div className="flex items-center mb-4">
            <Button variant="outline" size="sm" asChild className="mr-2">
              <Link to="/transactions">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Transactions
              </Link>
            </Button>
          </div>
        </header>
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-crypto-foreground">Transaction Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Transaction with ID {txid} could not be found.</p>
            <div className="mt-4">
              <Button asChild>
                <Link to="/transactions">
                  View All Transactions
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-crypto-background text-crypto-foreground p-6">
      <header className="mb-8">
        <div className="flex items-center mb-4">
          <Button variant="outline" size="sm" asChild className="mr-2">
            <Link to="/transactions">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Transactions
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Transaction Details</h1>
          {analysis && (
            <Badge 
              variant={getStatusBadgeVariant(analysis.status)} 
              className="ml-3 font-mono text-xs"
            >
              {analysis.status}
            </Badge>
          )}
        </div>
        <p className="text-crypto-foreground/70 font-mono text-sm break-all">
          TXID: {txid}
        </p>
      </header>
      
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <Card>
            <CardHeader className="pb-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-2">
                  <TabsTrigger value="analysis" className="data-[state=active]:bg-crypto-primary/20">
                    <Shield className="h-4 w-4 mr-2" />
                    Analysis
                  </TabsTrigger>
                  <TabsTrigger value="fragments" className="data-[state=active]:bg-crypto-primary/20">
                    <Key className="h-4 w-4 mr-2" />
                    Key Fragments
                  </TabsTrigger>
                  <TabsTrigger value="raw" className="data-[state=active]:bg-crypto-primary/20">
                    <FileCode className="h-4 w-4 mr-2" />
                    Raw Data
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            
            <CardContent>
              <TabsContent value="analysis" className="space-y-4">
                {!analysis ? (
                  <div className="text-center py-6 text-crypto-foreground/70">
                    No analysis data available for this transaction
                  </div>
                ) : (
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
                    
                    {analysis.prime_factors && analysis.prime_factors.length > 0 && (
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
                            <div className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                              <span className="text-green-500 font-medium">Private Key Recovered!</span>
                            </div>
                            <div className="mt-2 font-mono text-xs break-all">
                              {keyFragment.combined_fragments}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="fragments" className="space-y-4">
                {!keyFragment ? (
                  <div className="text-center py-6 text-crypto-foreground/70">
                    No key fragments available for this transaction
                  </div>
                ) : (
                  <div>
                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-2">Private Key Status</h3>
                      <div className={`p-4 rounded-md ${keyFragment.completed ? 'bg-green-500/10 border border-green-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                        <div className="flex items-center">
                          {keyFragment.completed ? (
                            <>
                              <Unlock className="h-5 w-5 text-green-500 mr-2" />
                              <span className="text-green-500 font-medium">Private Key Recovered!</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-5 w-5 text-amber-500 mr-2" />
                              <span className="text-amber-500 font-medium">Partial Key - {Object.keys(keyFragment.modulo_values).length} fragments collected</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
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
                            {Object.entries(keyFragment.modulo_values).map(([mod, remainder], index) => (
                              <tr key={index} className="border-b border-crypto-border/20 last:border-0">
                                <td className="py-2 pr-4">{mod}</td>
                                <td className="py-2">{remainder as string}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {keyFragment.completed && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium mb-2">Recovered Private Key (hex)</h3>
                        <div className="bg-crypto-background rounded-md p-4 font-mono text-xs break-all">
                          {keyFragment.combined_fragments}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="raw" className="space-y-4">
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Transaction Data</h3>
                  
                  <Collapsible className="w-full">
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-crypto-background p-4 font-medium">
                      Raw Transaction JSON
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 collapsible-open:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 rounded-md bg-crypto-background p-4 font-mono text-xs overflow-auto max-h-[400px]">
                        <pre>{transaction ? JSON.stringify(transaction.decoded_json, null, 2) : 'No data'}</pre>
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
                )}
              </TabsContent>
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-12 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Transaction Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-xs text-crypto-foreground/70">Created</div>
                <div>{transaction ? format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm') : '-'}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-xs text-crypto-foreground/70">Chain</div>
                <div>{transaction?.chain || 'Unknown'}</div>
              </div>
              
              {analysis && (
                <>
                  <div className="space-y-2">
                    <div className="text-xs text-crypto-foreground/70">Analysis Status</div>
                    <Badge variant={getStatusBadgeVariant(analysis.status)}>
                      {analysis.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-crypto-foreground/70">Vulnerability Type</div>
                    <div>{analysis.vulnerability_type}</div>
                  </div>
                </>
              )}
              
              <div className="pt-4 border-t border-crypto-border">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/">
                    <Eye className="mr-2 h-4 w-4" />
                    Analyze Another Transaction
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;
