
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/types';
import { SAMPLE_TRANSACTION } from '@/lib/mockVulnerabilities';
import { ExternalLink, FileCode, FileSearch, Play, Bitcoin, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TransactionViewerProps {
  transaction?: Transaction;
  onAnalyze: (txid: string) => void;
}

const TransactionViewer = ({ transaction = SAMPLE_TRANSACTION, onAnalyze }: TransactionViewerProps) => {
  const [activeView, setActiveView] = useState('decoded');
  const [totalInputValue, setTotalInputValue] = useState(0);
  
  // Calculate total value of inputs when transaction changes
  useEffect(() => {
    if (transaction && transaction.vin) {
      // For a real app, we would fetch the UTXO values from a blockchain API
      // For demo purposes, we'll estimate based on output values + a mock fee
      const outputSum = transaction.vout.reduce((sum, output) => sum + output.value, 0);
      // Assume a slightly higher input value to account for fees
      const estimatedInputValue = outputSum * 1.003; // 0.3% fee estimate
      setTotalInputValue(estimatedInputValue);
    }
  }, [transaction]);

  const handleAnalyze = () => {
    onAnalyze(transaction.txid);
  };

  // Format Bitcoin value to display properly
  const formatBtcValue = (value: number) => {
    return value.toFixed(8);
  };
  
  // Format USD value (mock conversion rate of $60,000 per BTC)
  const formatUsdValue = (btcValue: number) => {
    const usdValue = btcValue * 60000;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usdValue);
  };

  return (
    <Card className="bg-crypto-muted border-crypto-border h-full overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-crypto-foreground">Transaction Details</CardTitle>
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-crypto-foreground/70 hover:text-crypto-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">View on Explorer</span>
            </Button>
          </div>
        </div>
        <CardDescription className="text-crypto-foreground/70 font-mono text-xs break-all">
          TXID: {transaction.txid}
        </CardDescription>
      </CardHeader>
      
      {/* Add UTXO Value Information */}
      <div className="px-6 pb-4">
        <div className="bg-crypto-background/50 border border-crypto-border/40 rounded-md p-3 flex flex-col sm:flex-row justify-between">
          <div className="flex items-center">
            <Bitcoin className="h-5 w-5 text-amber-400 mr-2" />
            <div>
              <div className="text-sm font-medium">Total UTXO Value</div>
              <div className="font-mono">{formatBtcValue(totalInputValue)} BTC</div>
            </div>
          </div>
          <div className="flex items-center mt-2 sm:mt-0">
            <DollarSign className="h-5 w-5 text-green-500 mr-2" />
            <div>
              <div className="text-sm font-medium">Estimated Value</div>
              <div className="font-mono">{formatUsdValue(totalInputValue)}</div>
            </div>
          </div>
        </div>
      </div>
      
      <Tabs
        defaultValue={activeView}
        value={activeView}
        onValueChange={setActiveView}
        className="w-full"
      >
        <div className="px-6">
          <TabsList className="grid grid-cols-2 bg-crypto-background">
            <TabsTrigger value="decoded" className="data-[state=active]:bg-crypto-primary/20">
              <FileSearch className="h-4 w-4 mr-2" />
              Decoded
            </TabsTrigger>
            <TabsTrigger value="raw" className="data-[state=active]:bg-crypto-primary/20">
              <FileCode className="h-4 w-4 mr-2" />
              Raw Hex
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-0 relative">
          <TabsContent 
            value="decoded" 
            className="mt-0 max-h-[350px] overflow-auto p-6 terminal-text text-xs faded-edge"
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-crypto-primary mb-1">General</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 ml-4">
                  <div className="text-crypto-foreground/70">Version:</div>
                  <div>{transaction.version}</div>
                  <div className="text-crypto-foreground/70">Locktime:</div>
                  <div>{transaction.locktime}</div>
                  {transaction.blocktime && (
                    <>
                      <div className="text-crypto-foreground/70">Block time:</div>
                      <div>{new Date(transaction.blocktime * 1000).toLocaleString()}</div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-crypto-primary mb-1">Inputs ({transaction.vin.length})</h4>
                {transaction.vin.map((input, index) => (
                  <div key={index} className="mb-2 ml-4 p-2 rounded bg-crypto-background">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <div className="text-crypto-foreground/70">TXID:</div>
                      <div className="break-all">{input.txid}</div>
                      <div className="text-crypto-foreground/70">Vout:</div>
                      <div>{input.vout}</div>
                      <div className="text-crypto-foreground/70">Sequence:</div>
                      <div>{input.sequence}</div>
                      {/* Estimate UTXO value based on position */}
                      <div className="text-crypto-foreground/70">Est. Value:</div>
                      <div className="flex items-center">
                        <Bitcoin className="h-3 w-3 text-amber-400 mr-1" />
                        {formatBtcValue(totalInputValue / transaction.vin.length)} BTC
                        <Badge variant="outline" className="ml-2 text-xs">
                          ~{formatUsdValue(totalInputValue / transaction.vin.length).slice(0, -3)}
                        </Badge>
                      </div>
                    </div>
                    {input.scriptSig && (
                      <div className="mt-1 pt-1 border-t border-crypto-border">
                        <div className="text-crypto-foreground/70">Script:</div>
                        <div className="break-all bg-crypto-muted p-1 rounded mt-1">
                          <span className="text-crypto-accent">asm:</span> {input.scriptSig.asm}
                        </div>
                        <div className="break-all bg-crypto-muted p-1 rounded mt-1">
                          <span className="text-crypto-accent">hex:</span> {input.scriptSig.hex}
                        </div>
                      </div>
                    )}
                    {input.txinwitness && (
                      <div className="mt-1 pt-1 border-t border-crypto-border">
                        <div className="text-crypto-foreground/70">Witness:</div>
                        {input.txinwitness.map((witness, i) => (
                          <div key={i} className="break-all bg-crypto-muted p-1 rounded mt-1">
                            {witness}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <h4 className="font-medium text-crypto-primary mb-1">Outputs ({transaction.vout.length})</h4>
                {transaction.vout.map((output, index) => (
                  <div key={index} className="mb-2 ml-4 p-2 rounded bg-crypto-background">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <div className="text-crypto-foreground/70">Value:</div>
                      <div className="flex items-center">
                        {formatBtcValue(output.value)} BTC
                        <Badge variant="outline" className="ml-2 text-xs">
                          ~{formatUsdValue(output.value).slice(0, -3)}
                        </Badge>
                      </div>
                      <div className="text-crypto-foreground/70">n:</div>
                      <div>{output.n}</div>
                      <div className="text-crypto-foreground/70">Type:</div>
                      <div>{output.scriptPubKey.type}</div>
                    </div>
                    {output.scriptPubKey.addresses && (
                      <div className="mt-1 pt-1 border-t border-crypto-border">
                        <div className="text-crypto-foreground/70">Addresses:</div>
                        {output.scriptPubKey.addresses.map((address, i) => (
                          <div key={i} className="break-all bg-crypto-muted p-1 rounded mt-1">
                            {address}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-1 pt-1 border-t border-crypto-border">
                      <div className="text-crypto-foreground/70">Script:</div>
                      <div className="break-all bg-crypto-muted p-1 rounded mt-1">
                        <span className="text-crypto-accent">asm:</span> {output.scriptPubKey.asm}
                      </div>
                      <div className="break-all bg-crypto-muted p-1 rounded mt-1">
                        <span className="text-crypto-accent">hex:</span> {output.scriptPubKey.hex}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent 
            value="raw" 
            className="mt-0 max-h-[350px] overflow-auto p-6 font-mono text-xs"
          >
            <div className="bg-crypto-background p-4 rounded break-all">
              {transaction.hex || "Raw transaction hex not available"}
            </div>
          </TabsContent>
        </CardContent>
        
        <CardFooter className="p-6 pt-4">
          <Button 
            onClick={handleAnalyze}
            className="w-full bg-crypto-accent hover:bg-crypto-accent/80"
          >
            <Play className="mr-2 h-4 w-4" />
            Analyze Vulnerability & Recover Key
          </Button>
        </CardFooter>
      </Tabs>
    </Card>
  );
};

export default TransactionViewer;
