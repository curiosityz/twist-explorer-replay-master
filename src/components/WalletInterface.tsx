
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase, Tables } from '@/integrations/supabase/client';
import { WalletKey, UTXO, formatBtcValue, deriveAddress, btcToSatoshis, satoshisToBtc, validateAddress } from '@/lib/walletUtils';
import { normalizePrivateKey, verifyPrivateKey } from '@/lib/cryptoUtils';
import { chainstackService } from '@/services/chainstackService';
import { toast } from 'sonner';
import { Copy, ArrowRight, Wallet, Plus, Key, CircleDollarSign, AlertCircle, Check, RefreshCw, Send, ShieldCheck } from 'lucide-react';

const WalletInterface = () => {
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
  
  // Load recovered keys from database on mount
  useEffect(() => {
    loadRecoveredKeys();
  }, []);
  
  // Load UTXOs when selected key changes
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
      // Fetch private key fragments that are completed
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
      
      // Process the keys to derive addresses
      const processedKeys: WalletKey[] = [];
      
      for (const fragment of data) {
        if (fragment.combined_fragments) {
          try {
            // Parse public key from public_key_hex
            const pubKeyX = fragment.public_key_hex.substring(0, 66);
            const pubKeyY = fragment.public_key_hex.substring(66);
            
            // Normalize the private key
            const normalizedKey = normalizePrivateKey(fragment.combined_fragments);
            
            // Verify the private key
            const isVerified = verifyPrivateKey(normalizedKey, pubKeyX, pubKeyY);
            
            // Derive Bitcoin address
            const address = deriveAddress(normalizedKey, selectedNetwork);
            
            processedKeys.push({
              privateKey: normalizedKey,
              publicKey: { x: pubKeyX, y: pubKeyY },
              address,
              network: selectedNetwork,
              verified: isVerified,
              balance: 0 // Will be updated when selected
            });
          } catch (err) {
            console.error('Error processing key:', fragment.id, err);
          }
        }
      }
      
      setWalletKeys(processedKeys);
      
      // Select the first key if available
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
      // Normalize the key
      const normalizedKey = normalizePrivateKey(importedKey.trim());
      
      // Check if already imported
      const exists = walletKeys.some(k => k.privateKey === normalizedKey);
      if (exists) {
        toast.error('This key has already been imported');
        return;
      }
      
      // Derive address
      const address = deriveAddress(normalizedKey, selectedNetwork);
      
      // Add to wallet keys
      const newKey: WalletKey = {
        privateKey: normalizedKey,
        publicKey: { x: '0x0', y: '0x0' }, // We don't have the public key for imported keys
        address,
        network: selectedNetwork,
        verified: false, // Can't verify without pubkey
        balance: 0
      };
      
      setWalletKeys(prev => [...prev, newKey]);
      setSelectedKeyIndex(walletKeys.length);
      setImportedKey('');
      toast.success('Private key imported successfully');
      
      // Load UTXOs for the new address
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
      
      // Update the balance in wallet keys
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
    
    // Calculate total input value
    const totalInputSatoshis = availableUtxos.reduce((sum, utxo) => sum + utxo.value, 0);
    
    // Estimate transaction size and fee
    const estimatedSize = 150 + availableUtxos.length * 150; // Rough estimate: 150 + inputs*150 bytes
    const estimatedFee = estimatedSize * feeRate;
    
    if (totalInputSatoshis < amountSatoshis + estimatedFee) {
      toast.error('Insufficient funds (including fees)');
      return;
    }
    
    // Calculate change amount
    const changeSatoshis = totalInputSatoshis - amountSatoshis - estimatedFee;
    
    try {
      // Format inputs
      const inputs = availableUtxos.map(utxo => ({
        txid: utxo.txid,
        vout: utxo.vout
      }));
      
      // Format outputs
      const outputs = [
        {
          address: recipientAddress,
          value: amountSatoshis
        }
      ];
      
      // Add change output if needed
      if (changeSatoshis > 546) { // Dust threshold
        outputs.push({
          address: selectedKey.address,
          value: changeSatoshis
        });
      }
      
      // In a real implementation, we would:
      // 1. Create raw transaction
      // 2. Sign it with the private key
      // 3. Broadcast to network
      
      // For this demo, we'll just display the transaction details
      toast.success('Transaction created successfully (demo)');
      
      const txDetails = {
        from: selectedKey.address,
        to: recipientAddress,
        amount: formatBtcValue(parseFloat(sendAmount)),
        fee: formatBtcValue(satoshisToBtc(estimatedFee)),
        total: formatBtcValue(satoshisToBtc(amountSatoshis + estimatedFee))
      };
      
      console.log('Transaction details:', txDetails);
      
      // Reset form
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
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-6 w-6" />
          Wallet
        </CardTitle>
        <CardDescription>
          Manage recovered private keys and send transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="import">Import Key</TabsTrigger>
          </TabsList>
          
          <TabsContent value="addresses" className="space-y-4">
            <div className="space-y-4">
              {walletKeys.length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-md">
                  <Key className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {loadingKeys 
                      ? 'Loading recovered keys...' 
                      : 'No private keys available yet'}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab('import')}
                    className="mt-2"
                  >
                    <Plus className="mr-2 h-4 w-4" /> 
                    Import Key
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Available Keys</h3>
                    <Select
                      value={selectedNetwork}
                      onValueChange={(value) => setSelectedNetwork(value as 'mainnet' | 'testnet')}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Network" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mainnet">Mainnet</SelectItem>
                        <SelectItem value="testnet">Testnet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    {walletKeys.map((key, index) => (
                      <div 
                        key={key.address}
                        className={`border p-3 rounded-md cursor-pointer transition-colors ${
                          index === selectedKeyIndex 
                            ? 'bg-primary/5 border-primary/30' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedKeyIndex(index)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={key.verified ? "default" : "secondary"}>
                              {key.verified ? 'Verified' : 'Imported'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{key.network}</span>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(key.privateKey, key.address);
                                  }}
                                >
                                  {copiedKey === key.address ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy Private Key</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        
                        <div className="font-mono text-sm break-all mb-2">
                          {key.address}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-sm flex items-center">
                            <CircleDollarSign className="h-4 w-4 mr-1 text-primary" />
                            <span>{formatBtcValue(key.balance || 0)} BTC</span>
                          </div>
                          
                          {index === selectedKeyIndex && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRefreshBalance();
                              }}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Refresh
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedKeyIndex >= 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <h3 className="text-sm font-medium mb-2">Private Key</h3>
                      <div className="bg-muted p-3 rounded-md">
                        <div className="font-mono text-xs break-all">
                          {walletKeys[selectedKeyIndex]?.privateKey}
                        </div>
                        {!walletKeys[selectedKeyIndex]?.verified && (
                          <div className="flex items-center mt-2 text-amber-500 text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            This key cannot be verified without public key information
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="transactions" className="space-y-4">
            {selectedKeyIndex < 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No wallet selected</AlertTitle>
                <AlertDescription>
                  Please select a wallet address from the Addresses tab first.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Send Transaction</h3>
                  <Badge variant="outline" className="font-mono">
                    {walletKeys[selectedKeyIndex]?.address.substring(0, 10)}...
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="space-y-2">
                      <Label htmlFor="balance">Available Balance</Label>
                      <div className="flex items-center">
                        <div className="text-2xl font-semibold">
                          {formatBtcValue(walletKeys[selectedKeyIndex]?.balance || 0)}
                        </div>
                        <span className="ml-2 text-muted-foreground">BTC</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Button onClick={handleRefreshBalance}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh Balance
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient Address</Label>
                    <Input
                      id="recipient"
                      placeholder="Enter Bitcoin address"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (BTC)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.00000001"
                      placeholder="0.00000000"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fee">Fee Rate (sat/vB)</Label>
                    <Select
                      value={feeRate.toString()}
                      onValueChange={(v) => setFeeRate(parseInt(v, 10))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fee rate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">High (50 sat/vB)</SelectItem>
                        <SelectItem value="20">Medium (20 sat/vB)</SelectItem>
                        <SelectItem value="5">Low (5 sat/vB)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={createTransaction}
                    disabled={!recipientAddress || !sendAmount || parseFloat(sendAmount) <= 0}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Create Transaction
                  </Button>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-2">UTXOs</h3>
                  
                  {loadingUtxos ? (
                    <div className="text-center py-4">
                      <RefreshCw className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Loading UTXOs...
                      </p>
                    </div>
                  ) : utxos.length === 0 ? (
                    <div className="bg-muted/50 text-center py-6 rounded-md">
                      <p className="text-sm text-muted-foreground">
                        No UTXOs found for this address
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-auto">
                      {utxos.map((utxo) => (
                        <div 
                          key={`${utxo.txid}-${utxo.vout}`}
                          className="bg-muted/50 p-3 rounded-md text-sm"
                        >
                          <div className="flex justify-between items-center">
                            <div className="font-mono text-xs truncate max-w-[180px]">
                              {utxo.txid}:{utxo.vout}
                            </div>
                            <Badge>
                              {formatBtcValue(utxo.value / 100000000)} BTC
                            </Badge>
                          </div>
                          {utxo.confirmations !== undefined && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Confirmations: {utxo.confirmations}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="private-key">Enter Private Key</Label>
                <Input
                  id="private-key"
                  placeholder="Private key (hex format)"
                  value={importedKey}
                  onChange={(e) => setImportedKey(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="network">Network</Label>
                <Select
                  value={selectedNetwork}
                  onValueChange={(value) => setSelectedNetwork(value as 'mainnet' | 'testnet')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mainnet">Mainnet</SelectItem>
                    <SelectItem value="testnet">Testnet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Security Notice</AlertTitle>
                <AlertDescription>
                  Private keys control your funds. Never share them with others and be cautious when importing.
                </AlertDescription>
              </Alert>
              
              <Button 
                className="w-full" 
                onClick={importPrivateKey}
                disabled={!importedKey.trim()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Import Key
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WalletInterface;
