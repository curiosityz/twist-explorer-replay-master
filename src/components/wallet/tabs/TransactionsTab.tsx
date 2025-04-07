
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Send } from 'lucide-react';
import { UTXO, formatBtcValue } from '@/lib/walletUtils';
import { WalletKey } from '@/lib/walletUtils';

interface TransactionTabProps {
  selectedKeyIndex: number;
  walletKeys: WalletKey[];
  recipientAddress: string;
  sendAmount: string;
  feeRate: number;
  utxos: UTXO[];
  loadingUtxos: boolean;
  onRecipientChange: (value: string) => void;
  onSendAmountChange: (value: string) => void;
  onFeeRateChange: (value: number) => void;
  onRefreshBalance: () => void;
  onCreateTransaction: () => void;
}

const TransactionsTab: React.FC<TransactionTabProps> = ({
  selectedKeyIndex,
  walletKeys,
  recipientAddress,
  sendAmount,
  feeRate,
  utxos,
  loadingUtxos,
  onRecipientChange,
  onSendAmountChange,
  onFeeRateChange,
  onRefreshBalance,
  onCreateTransaction
}) => {
  if (selectedKeyIndex < 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No wallet selected</AlertTitle>
        <AlertDescription>
          Please select a wallet address from the Addresses tab first.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Send Transaction</h3>
        <Badge variant="outline" className="font-mono">
          {walletKeys[selectedKeyIndex]?.address.substring(0, 10)}...
        </Badge>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 items-center">
          <div className="space-y-2">
            <Label htmlFor="balance">Available Balance</Label>
            <div className="flex items-center">
              <div className="text-2xl font-semibold">
                {formatBtcValue(walletKeys[selectedKeyIndex]?.balance || 0)}
              </div>
              <span className="ml-2 text-muted-foreground">BTC</span>
            </div>
          </div>
          
          <div className="text-right">
            <Button onClick={onRefreshBalance}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Balance
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient Address</Label>
          <Input
            id="recipient"
            placeholder="Enter Bitcoin address"
            value={recipientAddress}
            onChange={(e) => onRecipientChange(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (BTC)</Label>
          <Input
            id="amount"
            type="number"
            step="0.00000001"
            placeholder="0.00000000"
            value={sendAmount}
            onChange={(e) => onSendAmountChange(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="fee">Fee Rate (sat/vB)</Label>
          <Select
            value={feeRate.toString()}
            onValueChange={(v) => onFeeRateChange(parseInt(v, 10))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select fee rate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">High (50 sat/vB)</SelectItem>
              <SelectItem value="20">Medium (20 sat/vB)</SelectItem>
              <SelectItem value="5">Low (5 sat/vB)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button
          className="w-full"
          onClick={onCreateTransaction}
          disabled={!recipientAddress || !sendAmount || parseFloat(sendAmount) <= 0}
        >
          <Send className="mr-2 h-4 w-4" />
          Create Transaction
        </Button>
      </div>
      
      <div className="pt-4 border-t">
        <h3 className="text-sm font-medium mb-2">UTXOs</h3>
        
        {loadingUtxos ? (
          <div className="text-center py-4">
            <RefreshCw className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">
              Loading UTXOs...
            </p>
          </div>
        ) : utxos.length === 0 ? (
          <div className="bg-muted/50 text-center py-6 rounded-md">
            <p className="text-sm text-muted-foreground">
              No UTXOs found for this address
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-auto">
            {utxos.map((utxo) => (
              <div 
                key={`${utxo.txid}-${utxo.vout}`}
                className="bg-muted/50 p-3 rounded-md text-sm"
              >
                <div className="flex justify-between items-center">
                  <div className="font-mono text-xs truncate max-w-[180px]">
                    {utxo.txid}:{utxo.vout}
                  </div>
                  <Badge>
                    {formatBtcValue(utxo.value / 100000000)} BTC
                  </Badge>
                </div>
                {utxo.confirmations !== undefined && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Confirmations: {utxo.confirmations}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsTab;
