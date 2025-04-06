
import React, { useState } from 'react';
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
import { TransactionTabs } from './TransactionTabs';

interface TransactionDetailViewProps {
  transaction: any;
  onClose: () => void;
  isLoading?: boolean;
  txid?: string;
}

const TransactionDetailView: React.FC<TransactionDetailViewProps> = ({ 
  transaction, 
  onClose,
  isLoading = false,
  txid = '' 
}) => {
  return (
    <Card className="w-full">
      <CardHeader className="border-b pb-3">
        <div className="flex justify-between items-start">
          <TransactionHeader 
            txid={txid || (transaction?.txid || '')} 
            status={transaction?.status}
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
          <LoadingState />
        ) : !transaction ? (
          <NotFoundState txid={txid} />
        ) : (
          <Tabs defaultValue="raw" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="raw">Raw Data</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="keys">Key Fragments</TabsTrigger>
            </TabsList>
            <TabsContent value="raw" className="p-4">
              <RawDataTab transaction={transaction} analysis={null} />
            </TabsContent>
            <TabsContent value="analysis" className="p-4">
              <AnalysisTab 
                analysis={null} 
                keyFragment={null} 
                totalInputValue={0}
                keyVerificationStatus={null}
              />
            </TabsContent>
            <TabsContent value="keys" className="p-4">
              <KeyFragmentsTab 
                keyFragment={null}
                totalInputValue={0}
                keyVerificationStatus={null}
              />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionDetailView;
