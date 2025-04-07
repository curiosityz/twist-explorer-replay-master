
import React from 'react';
import WalletHeader from '@/components/wallet/WalletHeader';
import WalletSidebar from '@/components/wallet/WalletSidebar';
import WalletInterface from '@/components/WalletInterface';
import TransactionDetailView from '@/components/transactions/TransactionDetailView';
import { useWalletPage } from '@/hooks/useWalletPage';

const WalletPage = () => {
  const {
    showImport,
    importedKey,
    selectedTransaction,
    transactionData,
    analysisData,
    keyFragmentData,
    isLoading,
    totalInputValue,
    keyVerificationStatus,
    handleShowImport,
    handleHideImport,
    handleImportKey,
    handleTransactionSelected,
    handleCloseTransactionView
  } = useWalletPage();
  
  return (
    <div className="min-h-screen bg-crypto-background text-crypto-foreground">
      <div className="container mx-auto px-4 py-8">
        <WalletHeader />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {selectedTransaction ? (
              <TransactionDetailView
                transaction={transactionData}
                txid={selectedTransaction}
                analysis={analysisData}
                keyFragment={keyFragmentData}
                totalInputValue={totalInputValue}
                keyVerificationStatus={keyVerificationStatus}
                onClose={handleCloseTransactionView}
                isLoading={isLoading}
              />
            ) : (
              <WalletInterface />
            )}
          </div>
          
          <WalletSidebar
            showImport={showImport}
            importedKey={importedKey}
            onShowImport={handleShowImport}
            onHideImport={handleHideImport}
            onImportKey={handleImportKey}
            onTransactionSelected={handleTransactionSelected}
          />
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
