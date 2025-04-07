
import { useState, useEffect } from 'react';
import { useWalletKeyManagement } from './useWalletKeyManagement';
import { useUtxoManagement } from './useUtxoManagement';
import { useTransactionCreation } from './useTransactionCreation';

export const useWalletInterface = () => {
  const [activeTab, setActiveTab] = useState('addresses');
  
  const {
    walletKeys,
    selectedKeyIndex,
    importedKey,
    selectedNetwork,
    loadingKeys,
    copiedKey,
    setWalletKeys,
    setSelectedKeyIndex,
    setImportedKey,
    setSelectedNetwork,
    loadRecoveredKeys,
    importPrivateKey,
    copyToClipboard
  } = useWalletKeyManagement();
  
  const {
    utxos,
    selectedUTXOs,
    loadingUtxos,
    setSelectedUTXOs,
    loadUtxosForAddress,
    toggleUtxoSelection,
    handleRefreshBalance
  } = useUtxoManagement(walletKeys, selectedKeyIndex, setWalletKeys);
  
  const {
    recipientAddress,
    sendAmount,
    feeRate,
    setRecipientAddress,
    setSendAmount,
    setFeeRate,
    createTransaction
  } = useTransactionCreation(walletKeys, selectedKeyIndex, utxos, setSelectedUTXOs);
  
  // Connect hooks and manage data flow between them
  useEffect(() => {
    if (selectedKeyIndex >= 0 && walletKeys[selectedKeyIndex]) {
      loadUtxosForAddress(walletKeys[selectedKeyIndex].address);
    }
  }, [selectedKeyIndex, walletKeys]);
  
  return {
    // From key management
    walletKeys,
    selectedKeyIndex,
    importedKey,
    selectedNetwork,
    loadingKeys,
    copiedKey,
    setWalletKeys,
    setSelectedKeyIndex,
    setImportedKey,
    setSelectedNetwork,
    loadRecoveredKeys,
    importPrivateKey,
    copyToClipboard,
    
    // From UTXO management
    utxos,
    selectedUTXOs,
    loadingUtxos,
    setSelectedUTXOs,
    loadUtxosForAddress,
    toggleUtxoSelection,
    handleRefreshBalance,
    
    // From transaction management
    recipientAddress,
    sendAmount,
    feeRate,
    setRecipientAddress,
    setSendAmount,
    setFeeRate,
    createTransaction,
    
    // Tab management
    activeTab,
    setActiveTab
  };
};
