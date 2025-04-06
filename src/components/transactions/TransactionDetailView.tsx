
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RawDataTab } from './RawDataTab';
import { AnalysisTab } from './AnalysisTab';
import { KeyFragmentsTab } from './KeyFragmentsTab';
import { TransactionHeader } from './TransactionHeader';
import { LoadingState } from './LoadingState';
import { NotFoundState } from './NotFoundState';

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
  // For debugging purposes, log the props to see if we're getting proper data
  React.useEffect(() => {
    console.log("TransactionDetailView props:", {
      txid,
      hasTransaction: !!transaction,
      hasAnalysis: !!analysis,
      hasKeyFragment: !!keyFragment,
      keyFragmentCompleted: keyFragment?.completed,
      keyFragmentCombined: keyFragment?.combined_fragments,
      keyVerificationStatus,
      totalInputValue
    });
  }, [transaction, analysis, keyFragment, keyVerificationStatus, totalInputValue, txid]);

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
          <LoadingState txid={txid} />
        ) : !transaction ? (
          <NotFoundState txid={txid} />
        ) : (
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="keys">
                Key Fragments
                {keyFragment && keyFragment.modulo_values && (
                  <span className="ml-1 text-xs bg-amber-500/20 text-amber-500 px-1 rounded">
                    {Object.keys(keyFragment.modulo_values).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="raw">Raw Data</TabsTrigger>
            </TabsList>
            <TabsContent value="analysis" className="p-4">
              <AnalysisTab 
                analysis={analysis || transaction.analysis} 
                keyFragment={keyFragment} 
                totalInputValue={totalInputValue}
                keyVerificationStatus={keyVerificationStatus}
              />
            </TabsContent>
            <TabsContent value="keys" className="p-4">
              <KeyFragmentsTab 
                keyFragment={keyFragment}
                totalInputValue={totalInputValue}
                keyVerificationStatus={keyVerificationStatus}
              />
            </TabsContent>
            <TabsContent value="raw" className="p-4">
              <RawDataTab transaction={transaction} analysis={analysis} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionDetailView;
