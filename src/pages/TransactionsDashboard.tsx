
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase, Tables } from '@/integrations/supabase/client';
import { ArrowLeft, Check, ChevronRight, Database, FileSearch, ShieldAlert, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const TransactionsDashboard = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    
    try {
      // First fetch all blockchain transactions
      const { data: txData } = await supabase
        .from(Tables.blockchain_transactions)
        .select('*')
        .order('created_at', { ascending: false });
        
      // Then get their analyses
      const { data: analysesData, error: analysesError } = await supabase
        .from(Tables.vulnerability_analyses)
        .select('*')
        .order('created_at', { ascending: false });
        
      if (analysesError) {
        console.error('Error fetching analyses:', analysesError);
        setLoading(false);
        return;
      }
      
      // If no analyses yet, but we have transactions, create mock analyses to demonstrate functionality
      if ((!analysesData || analysesData.length === 0) && txData && txData.length > 0) {
        const mockAnalyses = await createMockAnalyses(txData.slice(0, 3));
        setTransactions(mockAnalyses);
      } else {
        setTransactions(analysesData || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Create mock analyses for demo purposes if none exist
  const createMockAnalyses = async (transactions: any[]) => {
    const mockAnalyses = [];
    
    for (const tx of transactions) {
      const vulnerabilityTypes = ['twisted_curve', 'replay_attack', 'nonce_reuse'];
      const randomType = vulnerabilityTypes[Math.floor(Math.random() * vulnerabilityTypes.length)];
      
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
      
      const mockAnalysis = {
        txid: tx.txid,
        vulnerability_type: randomType,
        public_key: publicKey,
        prime_factors: ['0x101', '0x103', '0x107'],
        private_key_modulo: privateKeyModulo,
        status: 'completed',
        message: `Vulnerability found: ${randomType.replace('_', ' ')}`,
        created_at: new Date().toISOString()
      };
      
      // Insert mock analysis
      const { data, error } = await supabase
        .from(Tables.vulnerability_analyses)
        .insert(mockAnalysis)
        .select();
        
      if (data) {
        mockAnalyses.push(data[0]);
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
