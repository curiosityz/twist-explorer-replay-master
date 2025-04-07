
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import PrivateKeyInput from './key/PrivateKeyInput';
import NormalizedKeyDisplay from './key/NormalizedKeyDisplay';
import BitcoinAddressDisplay from './key/BitcoinAddressDisplay';
import WalletSummary from './key/WalletSummary';
import KeyActionButtons from './key/KeyActionButtons';
import { useKeyManagement } from './key/KeyManagementHook';
import { WalletKey } from '@/lib/walletUtils';

interface KeyManagementPanelProps {
  initialPrivateKey?: string;
  onKeyChange?: (keyData: WalletKey) => void;
}

const KeyManagementPanel = ({ initialPrivateKey, onKeyChange }: KeyManagementPanelProps) => {
  const {
    privateKey,
    normalizedKey,
    walletData,
    address,
    isKeyVerified,
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
  } = useKeyManagement(initialPrivateKey, onKeyChange);

  return (
    <Card className="bg-crypto-muted border-crypto-border">
      <CardHeader>
        <CardTitle className="text-crypto-foreground">Key Management</CardTitle>
        <CardDescription className="text-crypto-foreground/70">
          Enter or import your private key to manage your wallet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <PrivateKeyInput 
          privateKey={privateKey} 
          onChange={handleKeyInputChange} 
        />

        <NormalizedKeyDisplay normalizedKey={normalizedKey} />

        <BitcoinAddressDisplay 
          address={address} 
          isRefreshing={isRefreshing} 
          onRefresh={handleRefreshAddress} 
        />

        <WalletSummary walletData={walletData} />
      </CardContent>
      <CardFooter>
        <KeyActionButtons
          normalizedKey={normalizedKey}
          isImporting={isImporting}
          isExporting={isExporting}
          isDeleting={isDeleting}
          onVerify={handleVerifyKey}
          onImport={handleImportKey}
          onExport={handleExportKey}
          onDelete={handleDeleteKey}
        />
      </CardFooter>
    </Card>
  );
};

export default KeyManagementPanel;
