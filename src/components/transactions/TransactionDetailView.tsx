
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { TransactionHeader } from './TransactionHeader';
import { TransactionTabs } from './TransactionTabs';
import { TransactionLoadingView } from './TransactionLoadingView';
import { TransactionNotFoundView } from './TransactionNotFoundView';
import { toast } from 'sonner';

interface TransactionDetailViewProps {
  transaction: any;
  onClose: () => void;
  isLoading?: boolean;
  txid?: string;
  analysis?: any;
  keyFragment?: any;
  totalInputValue?: number;
  keyVerificationStatus?: boolean | null;
}

const TransactionDetailView: React.FC<TransactionDetailViewProps> = ({ 
  transaction, 
  onClose,
  isLoading = false,
  txid = '',
  analysis = null,
  keyFragment = null,
  totalInputValue = 0,
  keyVerificationStatus = null
}) => {
  // Debug component props on each render
  useEffect(() => {
    console.log("TransactionDetailView rendering with props:", {
      txid,
      hasTransaction: !!transaction,
      hasAnalysis: !!analysis,
      hasKeyFragment: !!keyFragment,
      keyFragmentProperties: keyFragment ? Object.keys(keyFragment) : [],
      keyVerificationStatus,
      totalInputValue
    });
    
    if (keyFragment) {
      console.log("Key fragment modulo values:", keyFragment.modulo_values);
      console.log("Combined fragments value:", keyFragment.combined_fragments);
    }
  }, [transaction, analysis, keyFragment, keyVerificationStatus, totalInputValue, txid]);

  // Check if we're using mock data and notify the user once
  useEffect(() => {
    if (transaction && !transaction.blocktime && !isLoading) {
      toast.info("Using demo data for transaction", {
        description: "Unable to connect to blockchain node. Using fallback demo data.",
        id: "mock-transaction-notice",
        duration: 5000
      });
    }
  }, [transaction, isLoading]);

  return (
    <Card className="w-full">
      <CardHeader className="border-b pb-3">
        <div className="flex justify-between items-start">
          <TransactionHeader 
            txid={txid || (transaction?.txid || '')} 
            status={transaction?.status || analysis?.status}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <TransactionLoadingView txid={txid} />
        ) : !transaction ? (
          <TransactionNotFoundView txid={txid} />
        ) : (
          <TransactionTabs
            analysis={analysis}
            transaction={transaction}
            keyFragment={keyFragment}
            totalInputValue={totalInputValue}
            keyVerificationStatus={keyVerificationStatus}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionDetailView;
