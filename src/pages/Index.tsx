
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { NodeConfiguration, Transaction } from '@/types';
import ConnectionPanel from '@/components/ConnectionPanel';
import TransactionFetcher from '@/components/TransactionFetcher';
import TransactionViewer from '@/components/TransactionViewer';
import CryptographicVisualizer from '@/components/CryptographicVisualizer';
import TransactionBatchUploader from '@/components/TransactionBatchUploader';
import { useToast } from '@/hooks/use-toast';
import { supabase, Tables } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { chainstackService } from '@/services/chainstackService';

const Index = () => {
  const [nodeConfig, setNodeConfig] = useState<NodeConfiguration | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [analyzingTxid, setAnalyzingTxid] = useState<string | null>(null);
  const [startAnalysis, setStartAnalysis] = useState(false);
  const { toast } = useToast();

  const handleConnect = (config: NodeConfiguration) => {
    setNodeConfig(config);
    toast({
      title: "Connection Successful",
      description: `Connected to ${config.name} (${config.chain})`,
    });
  };

  const handleFetchTransaction = async (txid: string) => {
    if (!txid) {
      toast({
        title: "Invalid Transaction ID",
        description: "Please provide a valid transaction ID",
        variant: "destructive"
      });
      return;
    }
    
    setStartAnalysis(false);
    
    try {
      // First try to fetch the transaction directly from the blockchain
      console.log("Fetching transaction from blockchain:", txid);
      const txData = await chainstackService.getTransaction(txid);
      
      if (txData) {
        setTransaction(txData);
        setAnalyzingTxid(txid);
        
        toast({
          title: "Transaction Fetched",
          description: `Transaction ${txid.substring(0, 8)}...${txid.substring(txid.length - 8)} loaded from blockchain`,
        });
        
        // After successfully fetching, store in database for future retrieval
        try {
          await supabase
            .from(Tables.blockchain_transactions)
            .upsert({
              txid: txid,
              chain: 'BTC',
              decoded_json: txData,
              raw_hex: txData.hex || '',
              processed: true
            }, {
              onConflict: 'txid'
            });
        } catch (dbError) {
          console.error("Error saving transaction to database:", dbError);
          // Non-critical error, don't show to user
        }
        
        return;
      }
      
      // If fetching directly fails, check our database
      const { data, error } = await supabase
        .from(Tables.blockchain_transactions)
        .select('*')
        .eq('txid', txid)
        .maybeSingle();
      
      if (data && !error) {
        // Use the transaction from database
        setTransaction(data.decoded_json as unknown as Transaction);
        setAnalyzingTxid(txid);
        toast({
          title: "Transaction Fetched",
          description: `Transaction ${txid.substring(0, 8)}...${txid.substring(txid.length - 8)} loaded from database`,
        });
      } else {
        toast({
          title: "Transaction Not Found",
          description: "Could not retrieve transaction from blockchain or database",
          variant: "destructive"
        });
        setTransaction(null);
      }
    } catch (error) {
      console.error("Error fetching transaction:", error);
      toast({
        title: "Error Fetching Transaction",
        description: "Could not fetch the transaction. Try configuring a different blockchain connection.",
        variant: "destructive"
      });
    }
  };

  const handleAnalyzeTransaction = (txid: string) => {
    if (!txid) return;
    
    setAnalyzingTxid(txid);
    setStartAnalysis(true);
    toast({
      title: "Analysis Started",
      description: "Analyzing transaction for cryptographic vulnerabilities...",
    });
  };

  return (
    <div className="min-h-screen bg-crypto-background text-crypto-foreground p-6">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-crypto-primary to-crypto-accent bg-clip-text text-transparent">
              Twisted Curve Explorer
            </h1>
            <p className="text-crypto-foreground/70 mt-2">
              Analyze and exploit cryptographic vulnerabilities in blockchain transactions
            </p>
          </div>
          <div>
            <Button asChild variant="outline" className="mr-2">
              <Link to="/transactions">
                Transaction Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/keys">
                Recovered Keys
              </Link>
            </Button>
          </div>
        </div>
      </header>
      
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-12 md:col-span-4 space-y-6">
          <ConnectionPanel onConnect={handleConnect} />
          <TransactionFetcher onFetch={handleFetchTransaction} />
          <TransactionBatchUploader onTransactionSelected={handleFetchTransaction} />
        </div>
        
        {/* Middle Column */}
        <div className="col-span-12 md:col-span-8 lg:col-span-4">
          <TransactionViewer 
            transaction={transaction || undefined} 
            onAnalyze={handleAnalyzeTransaction} 
          />
        </div>
        
        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4">
          <CryptographicVisualizer 
            txid={analyzingTxid || undefined} 
            startAnalysis={startAnalysis} 
          />
        </div>
      </div>
      
      <div className="mt-6">
        <Card className="bg-crypto-muted border-crypto-border p-4">
          <div className="text-xs text-crypto-foreground/70">
            <p className="font-mono">
              NOTE: This application connects to real blockchain data to analyze real cryptographic vulnerabilities.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
