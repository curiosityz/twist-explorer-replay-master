
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Key, AlertCircle, Check, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { normalizePrivateKey } from '@/lib/cryptoUtils';
import { Textarea } from '@/components/ui/textarea';

interface WalletKeyImportProps {
  onImport: (key: string) => void;
  onCancel: () => void;
}

const WalletKeyImport = ({ onImport, onCancel }: WalletKeyImportProps) => {
  const [privateKey, setPrivateKey] = useState('');
  const [isValidFormat, setIsValidFormat] = useState(false);

  const handleKeyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.trim();
    setPrivateKey(value);
    
    // Basic validation - check if it's a valid hex string of appropriate length
    const hexRegex = /^(0x)?[0-9a-fA-F]{64}$/;
    setIsValidFormat(hexRegex.test(value));
  };

  const handleImport = () => {
    if (!isValidFormat) {
      toast.error('Invalid private key format');
      return;
    }

    try {
      const normalizedKey = normalizePrivateKey(privateKey);
      onImport(normalizedKey);
      toast.success('Private key imported successfully');
    } catch (error) {
      console.error('Error importing key:', error);
      toast.error('Failed to import private key');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Key className="h-5 w-5 mr-2" />
          Import Private Key
        </CardTitle>
        <CardDescription>
          Enter a private key in hex format to import it into your wallet
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-crypto-foreground/70">Private Key (hex)</label>
          <Textarea 
            placeholder="0x... or raw hex"
            value={privateKey}
            onChange={handleKeyChange}
            className="font-mono min-h-20"
          />
          <p className="text-xs text-crypto-foreground/70">
            Enter a 64-character hexadecimal private key, with or without 0x prefix
          </p>
        </div>
        
        {privateKey && !isValidFormat && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invalid format</AlertTitle>
            <AlertDescription>
              The private key should be a 64-character hexadecimal string, optionally with 0x prefix
            </AlertDescription>
          </Alert>
        )}
        
        {privateKey && isValidFormat && (
          <Alert variant="default" className="bg-green-500/10 border-green-500/30 text-green-700">
            <Check className="h-4 w-4" />
            <AlertTitle>Valid format</AlertTitle>
            <AlertDescription>
              The private key format is valid and ready to import
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end space-x-2 border-t p-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          disabled={!isValidFormat} 
          onClick={handleImport}
          className="bg-crypto-accent hover:bg-crypto-accent/80"
        >
          <ArrowRight className="h-4 w-4 mr-1" />
          Import Key
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WalletKeyImport;
