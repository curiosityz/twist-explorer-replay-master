import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { WalletKey } from '@/lib/walletUtils';
import { verifyPrivateKey, normalizePrivateKey } from '@/lib/cryptoUtils';
import { deriveAddress } from '@/lib/walletUtils';

export const useKeyManagement = (initialPrivateKey?: string, onKeyChange?: (keyData: WalletKey) => void) => {
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

  return {
    privateKey,
    normalizedKey,
    walletData,
    address,
    isKeyVerified,
    verificationMessage,
    isImporting,
    isExporting,
    isDeleting,
    isRefreshing,
    handleKeyInputChange,
    handleVerifyKey,
    handleImportKey,
    handleExportKey,
    handleDeleteKey,
    handleRefreshAddress
  };
};
