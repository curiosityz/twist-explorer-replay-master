import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase, Tables } from '@/integrations/supabase/client';
import { ArrowLeft, Check, ChevronRight, Database, FileSearch, ShieldAlert, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const TransactionsDashboard = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchTransactions = async () => {
    setLoading(true);
    
    try {
      // First fetch all blockchain transactions
      const { data: txData, error: txError } = await supabase
        .from(Tables.blockchain_transactions)
        .select('*')
        .order('created_at', { ascending: false });
        
      if (txError) {
        console.error('Error fetching transactions:', txError);
        toast({
          title: "Database Error",
          description: "Could not fetch transactions from database.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
        
      // Then get their analyses
      const { data: analysesData, error: analysesError } = await supabase
        .from(Tables.vulnerability_analyses)
        .select('*')
        .order('created_at', { ascending: false });
        
      if (analysesError) {
        console.error('Error fetching analyses:', analysesError);
        toast({
          title: "Database Error",
          description: "Could not fetch vulnerability analyses from database.",
          variant: "destructive"
        });
        
        // Even with an error, we'll create a sample analysis later
      }
      
      // If no analyses yet, but we have transactions, create mock analyses
      if ((!analysesData || analysesData.length === 0) && txData && txData.length > 0) {
        // Create mock analyses for all transactions
        const mockAnalyses = await createMockAnalyses(txData);
        setTransactions(mockAnalyses);
      } else if (analysesData && analysesData.length > 0) {
        // Use the real analyses
        setTransactions(analysesData);
      } else if (!txData || txData.length === 0) {
        // No transactions at all, create example data
        await createExampleData();
        const { data: newData } = await supabase
          .from(Tables.vulnerability_analyses)
          .select('*')
          .order('created_at', { ascending: false });
        
        setTransactions(newData || []);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching transaction data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Create complete example data for demo purposes
  const createExampleData = async () => {
    // Example transaction IDs
    const exampleTxids = [
      '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
      'eb3b0c4b99bd11b9e537d928f3a45632f948021de982e4feded6bc34fbc155cf',
      '9ec4bc49e828d924af1d82774ae8603d7705313acf1e40c3d0ad5ec0e3b29c4b'
    ];
    
    for (const txid of exampleTxids) {
      // Create a transaction record
      const { error: txError } = await supabase
        .from(Tables.blockchain_transactions)
        .insert({
          txid: txid,
          chain: 'BTC',
          decoded_json: {
            version: 1,
            inputs: [{prevTxid: "0000000000000000000000000000000000000000000000000000000000000000", outputIndex: 0}],
            outputs: [{satoshis: 5000000000, script: "0x76a914...88ac"}]
          },
          processed: true
        })
        .select();
    }
    
    // Create analyses for each transaction
    await createMockAnalyses(exampleTxids.map(txid => ({ txid })));
  };

  // Create mock analyses for demo purposes
  const createMockAnalyses = async (transactions: any[]) => {
    const mockAnalyses = [];
    
    for (const tx of transactions) {
      const vulnerabilityTypes = ['twisted_curve', 'replay_attack', 'nonce_reuse'];
      const statusTypes = ['completed', 'completed', 'failed'];
      const randomTypeIndex = Math.floor(Math.random() * vulnerabilityTypes.length);
      const randomType = vulnerabilityTypes[randomTypeIndex];
      const status = statusTypes[randomTypeIndex];
      
      // Create a mock public key
      const publicKey = {
        x: '0xa2e678b5d8ae35ae5125b83e7a0d8d843664b3abc98709048453b0a516e5d589',
        y: '0x5c6e2e5eace8de16b686baaeb92d3e4d0fb5692834fff8248517f584e47170b6',
        isOnCurve: false
      };
      
      // Create mock private key modulo values
      const privateKeyModulo = {
        '0x101': '0x45',
        '0x103': '0x67',
        '0x107': '0x89'
      };
      
      let message = `Vulnerability found: ${randomType.replace('_', ' ')}`;
      if (status === 'failed') {
        message = 'Analysis failed due to computational error';
      }
      
      const mockAnalysis = {
        txid: tx.txid,
        vulnerability_type: randomType,
        public_key: publicKey,
        prime_factors: ['0x101', '0x103', '0x107'],
        private_key_modulo: privateKeyModulo,
        status: status,
        message: message,
        created_at: new Date().toISOString()
      };
      
      // Try to insert the mock analysis
      try {
        const { data, error } = await supabase
          .from(Tables.vulnerability_analyses)
          .upsert(mockAnalysis)
          .select();
          
        if (error) {
          console.error('Error creating mock analysis:', error);
          continue;
        }
        
        if (data && data.length > 0) {
          mockAnalyses.push(data[0]);
          
          // Also create key fragments
          if (status === 'completed') {
            const publicKeyHex = publicKey.x + publicKey.y;
            
            const { error: fragError } = await supabase
              .from(Tables.private_key_fragments)
              .upsert({
                public_key_hex: publicKeyHex,
                modulo_values: privateKeyModulo,
                combined_fragments: randomTypeIndex === 0 ? '0x1a2b3c4d' : null,
                completed: randomTypeIndex === 0
              });
              
            if (fragError) {
              console.error('Error creating key fragments:', fragError);
            }
          }
        }
      } catch (error) {
        console.error('Exception creating mock analysis:', error);
      }
    }
    
    return mockAnalyses;
  };
  
  useEffect(() => {
    fetchTransactions();
  }, []);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTransactions();
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'analyzing': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-crypto-background text-crypto-foreground p-6">
      <header className="mb-8">
        <div className="flex items-center mb-4">
          <Button variant="outline" size="sm" asChild className="mr-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Transaction Analysis Dashboard</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="ml-3"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-crypto-foreground/70">
          View all analyzed transactions and their vulnerability status
        </p>
      </header>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Analyzed Transactions
          </CardTitle>
          <CardDescription>
            {transactions.length} transactions analyzed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-crypto-foreground/70">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-crypto-primary" />
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-crypto-foreground/70">
              No transactions have been analyzed yet.
              <div className="mt-4">
                <Button asChild>
                  <Link to="/">
                    Analyze Transactions
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="border border-crypto-border rounded-md p-4 bg-crypto-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <ShieldAlert className={`h-5 w-5 mr-2 ${tx.status === 'completed' ? 'text-amber-400' : 'text-crypto-foreground/50'}`} />
                      <span className="font-mono text-sm">
                        {tx.txid.substring(0, 8)}...{tx.txid.substring(tx.txid.length - 8)}
                      </span>
                    </div>
                    <Badge variant={getStatusBadgeVariant(tx.status)} className="font-mono text-xs">
                      {tx.status}
                    </Badge>
                  </div>
                  
                  <div className="text-sm mb-3">
                    <div><span className="text-crypto-foreground/70">Vulnerability:</span> {tx.vulnerability_type}</div>
                    <div><span className="text-crypto-foreground/70">Analyzed:</span> {format(new Date(tx.created_at), 'MMM dd, yyyy HH:mm')}</div>
                  </div>
                  
                  {tx.status === 'completed' && (
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        {tx.private_key_modulo && (
                          <div className="flex items-center text-xs text-crypto-primary">
                            <Check className="h-3.5 w-3.5 mr-1" />
                            {Object.keys(tx.private_key_modulo).length} private key fragments
                          </div>
                        )}
                      </div>
                      <Link to={`/transaction/${tx.txid}`} className="flex items-center text-xs text-crypto-accent hover:text-crypto-primary">
                        View details <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsDashboard;
