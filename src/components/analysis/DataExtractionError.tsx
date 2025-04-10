
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSearch, RefreshCw, AlertTriangle } from 'lucide-react';

interface DataExtractionErrorProps {
  txid: string;
  onRetry: () => void;
  transaction: any;
}

const DataExtractionError: React.FC<DataExtractionErrorProps> = ({ txid, onRetry, transaction }) => {
  return (
    <Card className="bg-crypto-muted border-crypto-border">
      <CardHeader>
        <CardTitle className="text-crypto-foreground flex items-center">
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
          Data Extraction Failed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-4 mb-4">
          <h3 className="text-amber-500 font-medium mb-2">Could Not Extract Cryptographic Data</h3>
          <p className="text-sm">
            The system was unable to extract the necessary cryptographic data from this transaction.
            This may be because:
          </p>
          <ul className="list-disc list-inside text-sm mt-2 space-y-1">
            <li>The transaction uses a format we don't currently support</li>
            <li>The transaction doesn't contain standard signature data</li>
            <li>The data may be in an unexpected location in the transaction</li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Transaction ID</h4>
            <div className="bg-crypto-background p-2 rounded font-mono text-xs break-all">
              {txid}
            </div>
          </div>
          
          {transaction && (
            <div>
              <h4 className="text-sm font-medium mb-2">Transaction Type</h4>
              <div className="bg-crypto-background p-2 rounded text-xs">
                {transaction.version && `Version: ${transaction.version}`}
                {transaction.vin && Array.isArray(transaction.vin) && (
                  <div className="mt-1">Inputs: {transaction.vin.length}</div>
                )}
                {transaction.vout && Array.isArray(transaction.vout) && (
                  <div className="mt-1">Outputs: {transaction.vout.length}</div>
                )}
                {transaction.vin && Array.isArray(transaction.vin) && transaction.vin.length > 0 && (
                  <div className="mt-1">
                    Input Type: {
                      transaction.vin[0].txinwitness ? "SegWit" :
                      (transaction.vin[0].scriptSig ? "P2PKH/P2SH" : "Unknown")
                    }
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-between mt-6">
          <Button 
            variant="outline" 
            className="border-crypto-border text-crypto-foreground"
            onClick={() => {
              // Open transaction in blockchain explorer
              window.open(`https://blockchair.com/bitcoin/transaction/${txid}`, '_blank');
            }}
          >
            <FileSearch className="h-4 w-4 mr-2" />
            View in Explorer
          </Button>
          
          <Button 
            onClick={onRetry}
            className="bg-crypto-accent hover:bg-crypto-accent/80"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataExtractionError;
