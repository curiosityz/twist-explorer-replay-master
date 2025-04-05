
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { supabase, Tables } from '@/integrations/supabase/client';
import { formatBtcValue, formatUsdValue, deriveAddress } from '@/lib/walletUtils';
import { combinePrivateKeyFragments, verifyPrivateKey, normalizePrivateKey } from '@/lib/cryptoUtils';
import { WalletKey } from '@/lib/walletUtils';
import { Check, Copy, Download, Trash2, UploadCloud, RefreshCw } from 'lucide-react';

interface KeyManagementPanelProps {
  initialPrivateKey?: string;
  onKeyChange?: (keyData: WalletKey) => void;
}

const KeyManagementPanel = ({ initialPrivateKey, onKeyChange }: KeyManagementPanelProps) => {
  const [privateKey, setPrivateKey] = useState(initialPrivateKey || '');
  const [normalizedKey, setNormalizedKey] = useState('');
  const [walletData, setWalletData] = useState<WalletKey | null>(null);
  const [address, setAddress] = useState('');
  const [isValidAddress, setIsValidAddress] = useState(false);
  const [isKeyVerified, setIsKeyVerified] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast: showToast } = useToast();

  useEffect(() => {
    if (privateKey) {
      normalizeAndDerive(privateKey);
    }
  }, [privateKey]);

  const normalizeAndDerive = (key: string) => {
    try {
      const normalized = normalizePrivateKey(key);
      setNormalizedKey(normalized);
      deriveWalletData(normalized);
    } catch (error: any) {
      console.error("Error normalizing private key:", error.message);
      setWalletData(null);
      setAddress('');
      showToast({
        title: "Invalid Private Key",
        description: "The entered private key is not valid.",
        variant: "destructive"
      });
    }
  };

  const deriveWalletData = (normalizedKey: string) => {
    try {
      const derivedAddress = deriveAddress(normalizedKey);
      setAddress(derivedAddress);

      // Mock public key derivation for demo purposes
      const publicKey = {
        x: '0xa2e678b5d8ae35ae5125b83e7a0d8d843664b3abc98709048453b0a516e5d589',
        y: '0x5c6e2e5eace8de16b686baaeb92d3e4d0fb5692834fff8248517f584e47170b6'
      };

      const newWalletData: WalletKey = {
        privateKey: normalizedKey,
        publicKey: publicKey,
        address: derivedAddress,
        network: 'mainnet',
        balance: 0.0005,
        verified: false
      };

      setWalletData(newWalletData);
      onKeyChange?.(newWalletData);
    } catch (error: any) {
      console.error("Error deriving wallet data:", error.message);
      setWalletData(null);
      setAddress('');
      showToast({
        title: "Key Derivation Error",
        description: "Could not derive wallet data from the private key.",
        variant: "destructive"
      });
    }
  };

  const handleKeyInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrivateKey(e.target.value);
  };

  const handleVerifyKey = () => {
    if (!walletData) {
      setVerificationMessage('No wallet data available to verify.');
      setIsKeyVerified(false);
      return;
    }

    try {
      const isValid = verifyPrivateKey(normalizedKey, walletData.publicKey.x, walletData.publicKey.y);
      setIsKeyVerified(isValid);
      setVerificationMessage(isValid ? 'Private key successfully verified!' : 'Private key verification failed.');
      showToast({
        title: isValid ? "Key Verified" : "Key Verification Failed",
        description: verificationMessage,
        variant: isValid ? "default" : "destructive"
      });
    } catch (error: any) {
      console.error("Error verifying private key:", error.message);
      setIsKeyVerified(false);
      setVerificationMessage(`Verification Error: ${error.message}`);
      showToast({
        title: "Key Verification Error",
        description: "An error occurred during key verification.",
        variant: "destructive"
      });
    }
  };

  const handleImportKey = async () => {
    setIsImporting(true);
    try {
      // Simulate key import process
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock successful import
      showToast({
        title: "Key Imported",
        description: "Private key has been successfully imported.",
      });
    } catch (error: any) {
      console.error("Key import error:", error.message);
      showToast({
        title: "Key Import Failed",
        description: "Failed to import the private key.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportKey = () => {
    setIsExporting(true);
    try {
      // Simulate key export process
      const blob = new Blob([normalizedKey], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'privateKey.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast({
        title: "Key Exported",
        description: "Private key has been successfully exported.",
      });
    } catch (error: any) {
      console.error("Key export error:", error.message);
      showToast({
        title: "Key Export Failed",
        description: "Failed to export the private key.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteKey = async () => {
    setIsDeleting(true);
    try {
      // Simulate key deletion process
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Clear the private key and reset wallet data
      setPrivateKey('');
      setNormalizedKey('');
      setWalletData(null);
      setAddress('');
      setIsKeyVerified(false);
      setVerificationMessage('');

      showToast({
        title: "Key Deleted",
        description: "Private key has been successfully deleted.",
      });
    } catch (error: any) {
      console.error("Key deletion error:", error.message);
      showToast({
        title: "Key Deletion Failed",
        description: "Failed to delete the private key.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleRefreshAddress = () => {
    setIsRefreshing(true);
    try {
      if (normalizedKey) {
        deriveWalletData(normalizedKey);
        showToast({
          title: "Address Refreshed",
          description: "Bitcoin address has been refreshed.",
        });
      } else {
        showToast({
          title: "No Key Available",
          description: "Please enter a private key to derive the address.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Address refresh error:", error.message);
      showToast({
        title: "Address Refresh Failed",
        description: "Failed to refresh the Bitcoin address.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card className="bg-crypto-muted border-crypto-border">
      <CardHeader>
        <CardTitle className="text-crypto-foreground">Key Management</CardTitle>
        <CardDescription className="text-crypto-foreground/70">
          Enter or import your private key to manage your wallet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <label htmlFor="privateKey" className="text-sm font-medium leading-none text-crypto-foreground">
            Private Key
          </label>
          <textarea
            id="privateKey"
            className="flex h-24 w-full rounded-md border border-crypto-border bg-crypto-background px-3 py-2 text-sm placeholder:text-crypto-foreground/50 focus:outline-none focus:ring-2 focus:ring-crypto-primary focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 font-mono text-crypto-foreground"
            placeholder="Enter your private key"
            value={privateKey}
            onChange={handleKeyInputChange}
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="normalizedKey" className="text-sm font-medium leading-none text-crypto-foreground">
            Normalized Key
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              id="normalizedKey"
              className="flex w-full rounded-md border border-crypto-border bg-crypto-background px-3 py-2 text-sm placeholder:text-crypto-foreground/50 focus:outline-none focus:ring-2 focus:ring-crypto-primary focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 font-mono text-crypto-foreground"
              value={normalizedKey}
              readOnly
              disabled
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-crypto-foreground/70 hover:text-crypto-foreground"
              onClick={() => {
                navigator.clipboard.writeText(normalizedKey);
                toast.success("Normalized key copied to clipboard.");
              }}
              disabled={!normalizedKey}
            >
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy normalized key</span>
            </Button>
          </div>
        </div>

        <div className="grid gap-2">
          <label htmlFor="address" className="text-sm font-medium leading-none text-crypto-foreground">
            Bitcoin Address
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              id="address"
              className="flex w-full rounded-md border border-crypto-border bg-crypto-background px-3 py-2 text-sm placeholder:text-crypto-foreground/50 focus:outline-none focus:ring-2 focus:ring-crypto-primary focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 font-mono text-crypto-foreground"
              value={address}
              readOnly
              disabled
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshAddress}
              disabled={isRefreshing}
              className="h-8 w-8 p-0 text-crypto-foreground/70 hover:text-crypto-foreground"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-crypto-foreground/70 hover:text-crypto-foreground"
              onClick={() => {
                navigator.clipboard.writeText(address);
                toast.success("Bitcoin address copied to clipboard.");
              }}
              disabled={!address}
            >
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy address</span>
            </Button>
          </div>
        </div>

        {walletData && (
          <div className="space-y-2 border-t border-crypto-border pt-4">
            <div className="text-sm font-medium text-crypto-foreground">Wallet Summary</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-crypto-foreground/70">Balance</div>
                <div className="font-mono">{formatBtcValue(walletData.balance || 0)} BTC</div>
                <div className="text-xs text-crypto-foreground/70">Est. Value</div>
                <div className="font-mono">{formatUsdValue(walletData.balance || 0)}</div>
              </div>
              <div>
                <div className="text-xs text-crypto-foreground/70">Network</div>
                <div>{walletData.network}</div>
                <div className="text-xs text-crypto-foreground/70">Address</div>
                <div className="font-mono text-xs break-all">{walletData.address}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            onClick={handleVerifyKey}
            disabled={!normalizedKey}
          >
            <Check className="mr-2 h-4 w-4" />
            Verify Key
          </Button>
          <Button
            variant="outline"
            onClick={handleImportKey}
            disabled={isImporting}
          >
            {isImporting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" />
                Import Key
              </>
            )}
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleExportKey}
            disabled={isExporting || !normalizedKey}
          >
            {isExporting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Key
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteKey}
            disabled={isDeleting || !normalizedKey}
          >
            {isDeleting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Key
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default KeyManagementPanel;
