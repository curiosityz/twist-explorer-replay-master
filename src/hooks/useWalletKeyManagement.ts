
import { useState, useEffect } from 'react';
import { supabase, Tables } from '@/integrations/supabase/client';
import { WalletKey, deriveAddress } from '@/lib/walletUtils';
import { normalizePrivateKey, verifyPrivateKey } from '@/lib/cryptoUtils';
import { toast } from 'sonner';
import { saveImportedKeys, loadImportedKeys } from '@/lib/keyStorage';

export const useWalletKeyManagement = () => {
  const [walletKeys, setWalletKeys] = useState<WalletKey[]>([]);
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number>(-1);
  const [importedKey, setImportedKey] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<'mainnet' | 'testnet'>('mainnet');
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  useEffect(() => {
    loadAllKeys();
  }, []);
  
  // Save keys to localStorage whenever walletKeys changes
  useEffect(() => {
    if (walletKeys.length > 0) {
      saveImportedKeys(walletKeys);
    }
  }, [walletKeys]);
  
  const loadAllKeys = async () => {
    setLoadingKeys(true);
    
    try {
      // First load locally stored keys
      const localKeys = loadImportedKeys();
      const processedLocalKeys: WalletKey[] = localKeys.map(key => ({
        privateKey: key.privateKey || '',
        publicKey: { x: '0x0', y: '0x0' },
        address: key.address || '',
        network: key.network || 'mainnet',
        verified: key.verified || false,
        balance: key.balance || 0
      }));
      
      // Then load recovered keys from Supabase
      const recoveredKeys = await loadRecoveredKeys();
      
      // Combine both sets of keys (avoiding duplicates by private key)
      const allKeys = [...processedLocalKeys];
      
      for (const recoveredKey of recoveredKeys) {
        if (!allKeys.some(k => k.privateKey === recoveredKey.privateKey)) {
          allKeys.push(recoveredKey);
        }
      }
      
      setWalletKeys(allKeys);
      
      if (allKeys.length > 0) {
        setSelectedKeyIndex(0);
        toast.success(`${allKeys.length} key(s) loaded`);
      }
    } catch (err) {
      console.error('Error loading all keys:', err);
    } finally {
      setLoadingKeys(false);
    }
  };
  
  const loadRecoveredKeys = async (): Promise<WalletKey[]> => {
    try {
      const { data, error } = await supabase
        .from(Tables.private_key_fragments)
        .select('*')
        .eq('completed', true);
      
      if (error) {
        console.error('Error fetching keys:', error);
        toast.error('Error loading recovered keys');
        return [];
      }
      
      if (!data || data.length === 0) {
        console.log('No recovered private keys found in database');
        return [];
      }
      
      const processedKeys: WalletKey[] = [];
      
      for (const fragment of data) {
        if (fragment.combined_fragments) {
          try {
            const pubKeyX = fragment.public_key_hex?.substring(0, 66);
            const pubKeyY = fragment.public_key_hex?.substring(66);
            
            const normalizedKey = normalizePrivateKey(fragment.combined_fragments);
            console.log('Processing recovered key:', normalizedKey);
            
            const isVerified = pubKeyX && pubKeyY ? 
              verifyPrivateKey(normalizedKey, pubKeyX, pubKeyY) : false;
            
            const address = deriveAddress(normalizedKey, selectedNetwork);
            
            processedKeys.push({
              privateKey: normalizedKey,
              publicKey: { x: pubKeyX || '0x0', y: pubKeyY || '0x0' },
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
      
      return processedKeys;
    } catch (err) {
      console.error('Error in loadRecoveredKeys:', err);
      return [];
    }
  };
  
  const importPrivateKey = () => {
    if (!importedKey.trim()) {
      toast.error('Please enter a private key');
      return;
    }
    
    try {
      const normalizedKey = normalizePrivateKey(importedKey.trim());
      console.log('Importing key:', normalizedKey);
      
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
    toast.success('Copied to clipboard');
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
    copyToClipboard,
    loadAllKeys
  };
};
