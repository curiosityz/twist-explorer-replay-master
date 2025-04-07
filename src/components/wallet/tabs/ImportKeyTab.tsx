
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertCircle, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Plus } from 'lucide-react';

interface ImportKeyTabProps {
  importedKey: string;
  selectedNetwork: 'mainnet' | 'testnet';
  onImportedKeyChange: (value: string) => void;
  onNetworkChange: (value: 'mainnet' | 'testnet') => void;
  onImportKey: () => void;
}

const ImportKeyTab: React.FC<ImportKeyTabProps> = ({
  importedKey,
  selectedNetwork,
  onImportedKeyChange,
  onNetworkChange,
  onImportKey
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="private-key">Enter Private Key</Label>
        <Input
          id="private-key"
          placeholder="Private key (hex format)"
          value={importedKey}
          onChange={(e) => onImportedKeyChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Enter a private key in hex format (with or without 0x prefix)
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="network">Network</Label>
        <Select
          value={selectedNetwork}
          onValueChange={(value) => onNetworkChange(value as 'mainnet' | 'testnet')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mainnet">Mainnet</SelectItem>
            <SelectItem value="testnet">Testnet</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Security Notice</AlertTitle>
        <AlertDescription>
          Private keys control your funds. Never share them with others and be cautious when importing.
        </AlertDescription>
      </Alert>
      
      <Button 
        className="w-full" 
        onClick={onImportKey}
        disabled={!importedKey.trim()}
      >
        <Plus className="mr-2 h-4 w-4" />
        Import Key
      </Button>
    </div>
  );
};

export default ImportKeyTab;
