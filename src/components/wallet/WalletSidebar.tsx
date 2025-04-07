
import React from 'react';
import WalletActionCard from './WalletActionCard';
import WalletKeyImport from '@/components/WalletKeyImport';
import TransactionBatchUploader from '@/components/TransactionBatchUploader';
import KeyManagementPanel from '@/components/KeyManagementPanel';

interface WalletSidebarProps {
  showImport: boolean;
  importedKey: string | null;
  onShowImport: () => void;
  onHideImport: () => void;
  onImportKey: (key: string) => void;
  onTransactionSelected: (txid: string) => void;
}

const WalletSidebar: React.FC<WalletSidebarProps> = ({
  showImport,
  importedKey,
  onShowImport,
  onHideImport,
  onImportKey,
  onTransactionSelected
}) => {
  return (
    <div className="space-y-6">
      {showImport ? (
        <WalletKeyImport 
          onImport={onImportKey}
          onCancel={onHideImport}
        />
      ) : (
        <>
          <WalletActionCard onShowImport={onShowImport} />
          
          <TransactionBatchUploader
            onTransactionSelected={onTransactionSelected}
          />
          
          <KeyManagementPanel 
            initialPrivateKey={importedKey || undefined}
          />
        </>
      )}
    </div>
  );
};

export default WalletSidebar;
