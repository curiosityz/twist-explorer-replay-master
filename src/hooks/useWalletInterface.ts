
import { useState, useEffect } from 'react';
import { supabase, Tables } from '@/integrations/supabase/client';
import { WalletKey, UTXO, deriveAddress, btcToSatoshis, satoshisToBtc, validateAddress } from '@/lib/walletUtils';
import { normalizePrivateKey, verifyPrivateKey } from '@/lib/cryptoUtils';
import { chainstackService } from '@/services/chainstackService';
import { toast } from 'sonner';

export const useWalletInterface = () => {
  const [walletKeys, setWalletKeys] = useState<WalletKey[]>([]);
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number>(-1);
  const [importedKey, setImportedKey] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<'mainnet' | 'testnet'>('mainnet');
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [selectedUTXOs, setSelectedUTXOs] = useState<UTXO[]>([]);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [feeRate, setFeeRate] = useState(20); // Medium fee in sat/vB
  const [utxos, setUtxos] = useState<UTXO[]>([]);
  const [activeTab, setActiveTab] = useState('addresses');
  const [loadingUtxos, setLoadingUtxos] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  useEffect(() => {
    loadRecoveredKeys();
  }, []);
  
  useEffect(() => {
    if (selectedKeyIndex >= 0 && walletKeys[selectedKeyIndex]) {
      loadUtxosForAddress(walletKeys[selectedKeyIndex].address);
    } else {
      setUtxos([]);
    }
  }, [selectedKeyIndex, walletKeys]);
  
  const loadRecoveredKeys = async () => {
    setLoadingKeys(true);
    try {
      const localStorageImportedKeys = localStorage.getItem('importedKeys');
      const importedKeyIds = localStorageImportedKeys ? JSON.parse(localStorageImportedKeys) : [];
      
      const { data, error } = await supabase
        .from(Tables.private_key_fragments)
        .select('*')
        .eq('completed', true);
      
      if (error) {
        console.error('Error fetching keys:', error);
        toast.error('Error loading recovered keys');
        return;
      }
      
      if (!data || data.length === 0) {
        toast.info('No recovered private keys found');
        setLoadingKeys(false);
        return;
      }
      
      const processedKeys: WalletKey[] = [];
      
      for (const fragment of data) {
        if (fragment.combined_fragments) {
          try {
            const pubKeyX = fragment.public_key_hex.substring(0, 66);
            const pubKeyY = fragment.public_key_hex.substring(66);
            
            const normalizedKey = normalizePrivateKey(fragment.combined_fragments);
            
            const isVerified = verifyPrivateKey(normalizedKey, pubKeyX, pubKeyY);
            
            const address = deriveAddress(normalizedKey, selectedNetwork);
            
            processedKeys.push({
              privateKey: normalizedKey,
              publicKey: { x: pubKeyX, y: pubKeyY },
              address,
              network: selectedNetwork,
              verified: isVerified,
              balance: 0
            });
          } catch (err) {
            console.error('Error processing key:', fragment.id, err);
          }
        }
      }
      
      setWalletKeys(processedKeys);
      
      if (processedKeys.length > 0) {
        setSelectedKeyIndex(0);
        toast.success(`${processedKeys.length} private key(s) loaded`);
      }
    } catch (err) {
      console.error('Error in loadRecoveredKeys:', err);
      toast.error('Failed to load keys');
    } finally {
      setLoadingKeys(false);
    }
  };
  
  const importPrivateKey = () => {
    if (!importedKey.trim()) {
      toast.error('Please enter a private key');
      return;
    }
    
    try {
      const normalizedKey = normalizePrivateKey(importedKey.trim());
      
      const exists = walletKeys.some(k => k.privateKey === normalizedKey);
      if (exists) {
        toast.error('This key has already been imported');
        return;
      }
      
      const address = deriveAddress(normalizedKey, selectedNetwork);
      
      const newKey: WalletKey = {
        privateKey: normalizedKey,
        publicKey: { x: '0x0', y: '0x0' },
        address,
        network: selectedNetwork,
        verified: false,
        balance: 0
      };
      
      setWalletKeys(prev => [...prev, newKey]);
      setSelectedKeyIndex(walletKeys.length);
      setImportedKey('');
      toast.success('Private key imported successfully');
      
      loadUtxosForAddress(address);
    } catch (err) {
      console.error('Error importing key:', err);
      toast.error('Invalid private key format');
    }
  };
  
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
  
  const createTransaction = async () => {
    if (selectedKeyIndex < 0 || !walletKeys[selectedKeyIndex]) {
      toast.error('No wallet key selected');
      return;
    }
    
    if (!validateAddress(recipientAddress)) {
      toast.error('Invalid recipient address');
      return;
    }
    
    if (isNaN(parseFloat(sendAmount)) || parseFloat(sendAmount) <= 0) {
      toast.error('Invalid amount');
      return;
    }
    
    const amountSatoshis = btcToSatoshis(parseFloat(sendAmount));
    const selectedKey = walletKeys[selectedKeyIndex];
    const availableUtxos = utxos;
    
    if (!availableUtxos.length) {
      toast.error('No UTXOs available to spend');
      return;
    }
    
    const totalInputSatoshis = availableUtxos.reduce((sum, utxo) => sum + utxo.value, 0);
    
    const estimatedSize = 150 + availableUtxos.length * 150;
    const estimatedFee = estimatedSize * feeRate;
    
    if (totalInputSatoshis < amountSatoshis + estimatedFee) {
      toast.error('Insufficient funds (including fees)');
      return;
    }
    
    const changeSatoshis = totalInputSatoshis - amountSatoshis - estimatedFee;
    
    try {
      const inputs = availableUtxos.map(utxo => ({
        txid: utxo.txid,
        vout: utxo.vout
      }));
      
      const outputs = [
        {
          address: recipientAddress,
          value: amountSatoshis
        }
      ];
      
      if (changeSatoshis > 546) {
        outputs.push({
          address: selectedKey.address,
          value: changeSatoshis
        });
      }
      
      toast.success('Transaction created successfully (demo)');
      
      const txDetails = {
        from: selectedKey.address,
        to: recipientAddress,
        amount: formatBtcValue(parseFloat(sendAmount)),
        fee: formatBtcValue(satoshisToBtc(estimatedFee)),
        total: formatBtcValue(satoshisToBtc(amountSatoshis + estimatedFee))
      };
      
      console.log('Transaction details:', txDetails);
      
      setRecipientAddress('');
      setSendAmount('');
      setSelectedUTXOs([]);
    } catch (err) {
      console.error('Error creating transaction:', err);
      toast.error('Failed to create transaction');
    }
  };
  
  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };
  
  const handleRefreshBalance = () => {
    if (selectedKeyIndex >= 0 && walletKeys[selectedKeyIndex]) {
      loadUtxosForAddress(walletKeys[selectedKeyIndex].address);
      toast.info('Refreshing balance...');
    }
  };

  return {
    walletKeys,
    selectedKeyIndex,
    importedKey,
    selectedNetwork,
    loadingKeys,
    selectedUTXOs,
    recipientAddress,
    sendAmount,
    feeRate,
    utxos,
    activeTab,
    loadingUtxos,
    copiedKey,
    setWalletKeys,
    setSelectedKeyIndex,
    setImportedKey,
    setSelectedNetwork,
    setSelectedUTXOs,
    setRecipientAddress,
    setSendAmount,
    setFeeRate,
    setActiveTab,
    loadRecoveredKeys,
    importPrivateKey,
    loadUtxosForAddress,
    toggleUtxoSelection,
    createTransaction,
    copyToClipboard,
    handleRefreshBalance
  };
};
