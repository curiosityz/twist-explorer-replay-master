
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatBtcValue, formatUsdValue } from '@/lib/walletUtils';
import { Copy, ExternalLink, File, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TransactionDetailViewProps {
  transaction: any;
  onClose: () => void;
}

const TransactionDetailView: React.FC<TransactionDetailViewProps> = ({
  transaction,
  onClose
}) => {
  const [activeTab, setActiveTab] = React.useState('summary');
  const [copied, setCopied] = React.useState(false);

  if (!transaction) {
    return null;
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Transaction ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const calculateTotalInput = (inputs: any[]) => {
    if (!inputs || !Array.isArray(inputs)) return 0;
    return inputs.reduce((sum, input) => sum + (input.value || 0), 0);
  };

  const calculateTotalOutput = (outputs: any[]) => {
    if (!outputs || !Array.isArray(outputs)) return 0;
    return outputs.reduce((sum, output) => sum + (output.value || 0), 0);
  };

  const estimateFee = (inputs: any[], outputs: any[]) => {
    const totalIn = calculateTotalInput(inputs);
    const totalOut = calculateTotalOutput(outputs);
    return Math.max(0, totalIn - totalOut);
  };

  return (
    <Card className="w-full h-full overflow-auto">
      <CardHeader className="sticky top-0 bg-crypto-background z-10 pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Transaction Details</CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="font-mono text-sm text-crypto-foreground/70 truncate">
            {transaction.txid}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full" 
            onClick={() => copyToClipboard(transaction.txid)}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full"
            asChild
          >
            <a 
              href={`https://www.blockchain.com/explorer/transactions/btc/${transaction.txid}`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="inputs">Inputs</TabsTrigger>
            <TabsTrigger value="outputs">Outputs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-crypto-foreground/70">Status</div>
                <Badge variant={transaction.confirmations > 0 ? "default" : "secondary"}>
                  {transaction.confirmations > 0 ? "Confirmed" : "Pending"}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-crypto-foreground/70">Confirmations</div>
                <div>{transaction.confirmations || 0}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-crypto-foreground/70">Timestamp</div>
                <div>{formatDate(transaction.time)}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-crypto-foreground/70">Block</div>
                <div className="font-mono">{transaction.blockhash ? 
                  transaction.blockhash.substring(0, 10) + '...' : 
                  'Unconfirmed'}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-crypto-foreground/70">Total Input</div>
                <div>{formatBtcValue(calculateTotalInput(transaction.vin))} BTC</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-crypto-foreground/70">Total Output</div>
                <div>{formatBtcValue(calculateTotalOutput(transaction.vout))} BTC</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-crypto-foreground/70">Fee</div>
                <div>{formatBtcValue(estimateFee(transaction.vin, transaction.vout))} BTC</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-crypto-foreground/70">Fee Rate</div>
                <div>~{Math.round(estimateFee(transaction.vin, transaction.vout) * 100000000 / (transaction.size || 250))} sat/vB</div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="inputs" className="space-y-4 pt-4">
            {transaction.vin && transaction.vin.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm font-medium">
                  {transaction.vin.length} Input{transaction.vin.length > 1 ? 's' : ''}
                </div>
                {transaction.vin.map((input: any, index: number) => (
                  <Card key={index} className="bg-crypto-background/50">
                    <CardContent className="py-3">
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <div className="text-xs text-crypto-foreground/70">Input Index</div>
                            <div>{index}</div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-xs text-crypto-foreground/70">Sequence</div>
                            <div className="font-mono text-xs">{input.sequence}</div>
                          </div>
                        </div>
                        
                        {input.txid && (
                          <div className="space-y-1">
                            <div className="text-xs text-crypto-foreground/70">Previous Output</div>
                            <div className="flex items-center gap-2">
                              <div className="font-mono text-xs truncate">
                                {input.txid}:{input.vout}
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 rounded-full"
                                onClick={() => copyToClipboard(input.txid)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {input.scriptSig && (
                          <div className="space-y-1">
                            <div className="text-xs text-crypto-foreground/70">ScriptSig</div>
                            <div className="font-mono text-xs bg-crypto-muted/50 p-2 rounded-md max-h-[100px] overflow-auto">
                              {input.scriptSig.hex}
                            </div>
                          </div>
                        )}
                        
                        {input.txinwitness && input.txinwitness.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-xs text-crypto-foreground/70">Witness</div>
                            <div className="font-mono text-xs bg-crypto-muted/50 p-2 rounded-md max-h-[100px] overflow-auto">
                              {input.txinwitness.join('\n')}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-crypto-foreground/70">
                No input data available
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="outputs" className="space-y-4 pt-4">
            {transaction.vout && transaction.vout.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm font-medium">
                  {transaction.vout.length} Output{transaction.vout.length > 1 ? 's' : ''}
                </div>
                {transaction.vout.map((output: any, index: number) => (
                  <Card key={index} className="bg-crypto-background/50">
                    <CardContent className="py-3">
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <div className="text-xs text-crypto-foreground/70">Output Index</div>
                            <div>{output.n}</div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-xs text-crypto-foreground/70">Value</div>
                            <div className="font-medium">
                              {formatBtcValue(output.value)} BTC
                              <span className="text-xs text-crypto-foreground/70 ml-1">
                                ({formatUsdValue(output.value)})
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-xs text-crypto-foreground/70">Type</div>
                          <div>{output.scriptPubKey?.type || 'Unknown'}</div>
                        </div>
                        
                        {output.scriptPubKey?.addresses && output.scriptPubKey.addresses.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-xs text-crypto-foreground/70">Addresses</div>
                            {output.scriptPubKey.addresses.map((address: string, i: number) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className="font-mono text-xs truncate">{address}</div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 rounded-full"
                                  onClick={() => copyToClipboard(address)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {output.scriptPubKey && (
                          <div className="space-y-1">
                            <div className="text-xs text-crypto-foreground/70">ScriptPubKey</div>
                            <div className="font-mono text-xs bg-crypto-muted/50 p-2 rounded-md max-h-[100px] overflow-auto">
                              {output.scriptPubKey.hex}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-crypto-foreground/70">
                No output data available
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TransactionDetailView;
