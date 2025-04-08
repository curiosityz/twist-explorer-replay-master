import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChainType, NodeConfiguration } from '@/types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ConnectionPanelProps {
  onConnect: (config: NodeConfiguration) => void;
}

const ConnectionPanel = ({ onConnect }: ConnectionPanelProps) => {
  const [formData, setFormData] = useState<Omit<NodeConfiguration, 'connected'>>({
    name: '',
    rpcUrl: 'https://bitcoin-mainnet.core.chainstack.com/fac1c3b4501696cd4da647064494271c',
    chain: 'BTC',
    apiKey: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleConnect = async () => {
    if (!formData.name.trim()) {
      setError('Please provide a name for this connection');
      return;
    }
    if (!formData.rpcUrl.trim()) {
      setError('Please provide a valid RPC URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate a connection attempt
      await new Promise((resolve, reject) => setTimeout(resolve, 1500));
      onConnect({ ...formData, connected: true });
    } catch (err) {
      setError('Failed to connect to the node. Please check your configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-crypto-muted border-crypto-border">
      <CardHeader>
        <CardTitle className="text-crypto-foreground flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-crypto-accent animate-pulse-glow"></span> 
          Node Connection
        </CardTitle>
        <CardDescription className="text-crypto-foreground/70">
          Configure connection to your Chainstack node
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Connection Name</Label>
            <Input
              id="name"
              placeholder="Bitcoin Mainnet"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="bg-crypto-background border-crypto-border"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rpcUrl">RPC Endpoint URL</Label>
            <Input
              id="rpcUrl"
              placeholder="https://example.core.chainstack.com/YOUR_KEY"
              value={formData.rpcUrl}
              onChange={(e) => handleChange('rpcUrl', e.target.value)}
              className="bg-crypto-background border-crypto-border font-mono text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="chain">Blockchain</Label>
            <Select 
              value={formData.chain} 
              onValueChange={(value) => handleChange('chain', value)}
            >
              <SelectTrigger className="bg-crypto-background border-crypto-border">
                <SelectValue placeholder="Select blockchain" />
              </SelectTrigger>
              <SelectContent className="bg-crypto-muted border-crypto-border">
                <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                <SelectItem value="BCH">Bitcoin Cash (BCH)</SelectItem>
                <SelectItem value="BSV">Bitcoin SV (BSV)</SelectItem>
                <SelectItem value="LTC">Litecoin (LTC)</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key (Optional)</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="••••••••••••••••••••••"
              value={formData.apiKey}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              className="bg-crypto-background border-crypto-border"
            />
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          
          <Button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full bg-crypto-accent hover:bg-crypto-accent/80"
          >
            {isLoading ? 'Connecting...' : 'Connect to Node'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionPanel;
