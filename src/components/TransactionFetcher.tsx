
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MOCK_VULNERABILITY_CASES } from '@/lib/mockVulnerabilities';
import { Search, Loader2 } from 'lucide-react';
import { Transaction, VulnerabilityCase } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TransactionFetcherProps {
  onFetch: (txid: string) => void;
}

const TransactionFetcher = ({ onFetch }: TransactionFetcherProps) => {
  const [txid, setTxid] = useState('');
  const [selectedVulnerability, setSelectedVulnerability] = useState<VulnerabilityCase | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleManualFetch = () => {
    if (!txid.trim()) return;
    setIsLoading(true);
    
    // Simulate fetching delay
    setTimeout(() => {
      onFetch(txid);
      setIsLoading(false);
    }, 1000);
  };

  const handlePresetFetch = (txid: string) => {
    setTxid(txid);
    setIsLoading(true);
    
    // Simulate fetching delay
    setTimeout(() => {
      onFetch(txid);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <Card className="bg-crypto-muted border-crypto-border">
      <CardHeader>
        <CardTitle className="text-crypto-foreground">Transaction Explorer</CardTitle>
        <CardDescription className="text-crypto-foreground/70">
          Fetch and analyze vulnerable transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4 bg-crypto-background">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="presets">Known Vulnerabilities</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                value={txid}
                onChange={(e) => setTxid(e.target.value)}
                placeholder="Enter transaction ID (txid)"
                className="flex-1 bg-crypto-background border-crypto-border font-mono text-sm"
              />
              <Button 
                onClick={handleManualFetch}
                disabled={!txid.trim() || isLoading}
                className="bg-crypto-primary hover:bg-crypto-primary/80"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="text-xs text-crypto-foreground/60 terminal-text">
              <p>Enter a transaction ID to analyze for cryptographic vulnerabilities.</p>
              <p>Example: 9ec4bc49e828d924af1d1029cacf709431abbde46d59554b62bc270e3b29c4b1</p>
            </div>
          </TabsContent>
          
          <TabsContent value="presets" className="space-y-4">
            {MOCK_VULNERABILITY_CASES.map((vulnerability, index) => (
              <div key={index} className="mb-4">
                <h3 className="text-sm font-medium mb-2 text-crypto-primary">{vulnerability.name}</h3>
                <div className="space-y-2 ml-2">
                  {vulnerability.transactions.slice(0, 2).map((tx, txIndex) => (
                    <div key={txIndex} className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-crypto-background border-crypto-border hover:border-crypto-primary text-xs w-full justify-start font-mono overflow-hidden"
                        onClick={() => handlePresetFetch(tx)}
                      >
                        {tx.substring(0, 8)}...{tx.substring(tx.length - 8)}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TransactionFetcher;
