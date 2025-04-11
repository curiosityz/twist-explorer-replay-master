
import React, { useState } from 'react';
import TransactionFetcher from '@/components/TransactionFetcher';
import TransactionViewer from '@/components/TransactionViewer';
import CryptographicVisualizer from '@/components/CryptographicVisualizer';
import BlockchainScanner from '@/components/BlockchainScanner';
import { fetchTransactionDetails } from '@/services/transactionService';
import { Transaction } from '@/types';

const Index = () => {
  const [transaction, setTransaction] = useState<Transaction | undefined>();
  const [txid, setTxid] = useState<string | undefined>();
  
  const handleFetchTransaction = async (transactionId: string) => {
    setTxid(transactionId);
    const tx = await fetchTransactionDetails(transactionId);
    setTransaction(tx as Transaction);
  };

  const handleAnalyze = (transactionId: string) => {
    setTxid(transactionId);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6 text-crypto-foreground">
        Bitcoin Vulnerability Scanner
      </h1>
      
      {/* Give the scanner more prominence */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <BlockchainScanner />
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <TransactionFetcher onFetch={handleFetchTransaction} />
          </div>
          <div className="lg:col-span-2">
            <CryptographicVisualizer 
              txid={txid} 
              transaction={transaction}
            />
          </div>
        </div>
        
        <div>
          <TransactionViewer 
            transaction={transaction} 
            onAnalyze={handleAnalyze}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
