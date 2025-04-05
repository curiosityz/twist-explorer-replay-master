
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { NodeConfiguration, Transaction } from '@/types';
import ConnectionPanel from '@/components/ConnectionPanel';
import TransactionFetcher from '@/components/TransactionFetcher';
import TransactionViewer from '@/components/TransactionViewer';
import CryptographicVisualizer from '@/components/CryptographicVisualizer';
import TransactionBatchUploader from '@/components/TransactionBatchUploader';
import { SAMPLE_TRANSACTION } from '@/lib/mockVulnerabilities';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
    setStartAnalysis(false);
    
    // First check if the transaction exists in our database
    const { data, error } = await supabase
      .from('blockchain_transactions')
      .select('*')
      .eq('txid', txid)
      .single();
    
    if (data && !error) {
      // Use the transaction from database
      setTransaction(data.decoded_json || SAMPLE_TRANSACTION);
      setAnalyzingTxid(txid);
      toast({
        title: "Transaction Fetched",
        description: `Transaction ${txid.substring(0, 8)}...${txid.substring(txid.length - 8)} loaded from database`,
      });
    } else {
      // Fall back to mock data
      setTransaction(SAMPLE_TRANSACTION);
      setAnalyzingTxid(txid);
      toast({
        title: "Transaction Fetched",
        description: `Transaction ${txid.substring(0, 8)}...${txid.substring(txid.length - 8)} loaded`,
      });
    }
  };

  const handleAnalyzeTransaction = (txid: string) => {
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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-crypto-primary to-crypto-accent bg-clip-text text-transparent">
          Twisted Curve Explorer
        </h1>
        <p className="text-crypto-foreground/70 mt-2">
          Analyze and exploit cryptographic vulnerabilities in blockchain transactions
        </p>
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
              NOTE: This application demonstrates the concepts behind the Twisted Curve and Cross-Chain Replay vulnerabilities for educational purposes only.
              Transactions are stored in the database for analysis and private key fragments are automatically combined when possible.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
