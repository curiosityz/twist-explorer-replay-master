
import { useState } from 'react';
import { chainstackService } from '@/services/chainstackService';
import { UTXO, WalletKey } from '@/lib/walletUtils';
import { toast } from 'sonner';

export const useUtxoManagement = (
  walletKeys: WalletKey[],
  selectedKeyIndex: number,
  setWalletKeys: (updater: (prev: WalletKey[]) => WalletKey[]) => void
) => {
  const [utxos, setUtxos] = useState<UTXO[]>([]);
  const [selectedUTXOs, setSelectedUTXOs] = useState<UTXO[]>([]);
  const [loadingUtxos, setLoadingUtxos] = useState(false);
  
  const loadUtxosForAddress = async (address: string) => {
    if (!address) return;
    
    setLoadingUtxos(true);
    try {
      const addressUtxos = await chainstackService.getAddressUtxos(address);
      setUtxos(addressUtxos);
      
      const balance = addressUtxos.reduce((sum, utxo) => sum + utxo.value, 0) / 100000000;
      setWalletKeys(prev => 
        prev.map((key, index) => 
          index === selectedKeyIndex ? { ...key, balance } : key
        )
      );
    } catch (err) {
      console.error('Error loading UTXOs:', err);
      toast.error('Failed to load transaction data');
    } finally {
      setLoadingUtxos(false);
    }
  };
  
  const toggleUtxoSelection = (utxo: UTXO) => {
    setSelectedUTXOs(prev => {
      const isSelected = prev.some(u => u.txid === utxo.txid && u.vout === utxo.vout);
      if (isSelected) {
        return prev.filter(u => !(u.txid === utxo.txid && u.vout === utxo.vout));
      } else {
        return [...prev, utxo];
      }
    });
  };
  
  const handleRefreshBalance = () => {
    if (selectedKeyIndex >= 0 && walletKeys[selectedKeyIndex]) {
      loadUtxosForAddress(walletKeys[selectedKeyIndex].address);
      toast.info('Refreshing balance...');
    }
  };

  return {
    utxos,
    selectedUTXOs,
    loadingUtxos,
    setSelectedUTXOs,
    loadUtxosForAddress,
    toggleUtxoSelection,
    handleRefreshBalance
  };
};
