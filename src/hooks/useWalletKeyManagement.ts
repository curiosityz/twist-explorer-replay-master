
import { useState, useEffect } from 'react';
import { supabase, Tables } from '@/integrations/supabase/client';
import { WalletKey, deriveAddress } from '@/lib/walletUtils';
import { normalizePrivateKey, verifyPrivateKey } from '@/lib/cryptoUtils';
import { toast } from 'sonner';

export const useWalletKeyManagement = () => {
  const [walletKeys, setWalletKeys] = useState<WalletKey[]>([]);
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number>(-1);
  const [importedKey, setImportedKey] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<'mainnet' | 'testnet'>('mainnet');
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  useEffect(() => {
    loadRecoveredKeys();
  }, []);
  
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
      
      return address;
    } catch (err) {
      console.error('Error importing key:', err);
      toast.error('Invalid private key format');
      return null;
    }
  };
  
  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return {
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
  };
};
