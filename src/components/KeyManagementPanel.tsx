
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Key, Copy, Check, ArrowDown, Trash2, XCircle, CheckCircle2, Wallet } from 'lucide-react';
import { supabase, Tables } from '@/integrations/supabase/client';
import { PrivateKeyFragment } from '@/types';
import { verifyPrivateKey } from '@/lib/cryptoUtils';
import { toast } from 'sonner';
import { satoshisToBtc, formatBtcValue, formatUsdValue } from '@/lib/walletUtils';

interface KeyManagementPanelProps {
  onClose: () => void;
}

const KeyManagementPanel = ({ onClose }: KeyManagementPanelProps) => {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [spentKeys, setSpentKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(Tables.private_key_fragments)
        .select('*')
        .order('updated_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching keys:', error);
        toast.error('Failed to load private keys');
      } else {
        setKeys(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load private keys');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportAllKeys = () => {
    const completedKeys = keys.filter(k => k.completed && k.combined_fragments);
    
    if (completedKeys.length === 0) {
      toast.error('No completed keys to export');
      return;
    }
    
    const keysData = completedKeys.map(key => ({
      publicKey: key.public_key_hex,
      privateKey: key.combined_fragments,
      verified: verifyPrivateKey(key.combined_fragments, key.public_key_hex.substring(0, 66), key.public_key_hex.substring(66)),
      recovered: new Date(key.updated_at).toISOString(),
      spent: spentKeys.has(key.id)
    }));
    
    const dataStr = JSON.stringify(keysData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileName = `crypto-recovery-keys-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
    
    toast.success(`Exported ${keysData.length} keys`);
  };

  const importKeyToWallet = (key: any) => {
    if (!key.completed || !key.combined_fragments) {
      toast.error('Cannot import incomplete key');
      return;
    }

    // In a real app, this would add the key to the active wallet
    // For this demo, we'll just mark it as "spent" in our UI
    const newSpentKeys = new Set(spentKeys);
    newSpentKeys.add(key.id);
    setSpentKeys(newSpentKeys);
    
    toast.success('Key imported to wallet');
  };

  const clearSpentKeys = () => {
    setSpentKeys(new Set());
    toast.success('Cleared spent key indicators');
  };

  // Mock balance calculation (in a real app would check blockchain)
  const getKeyBalance = (key: any) => {
    // Using the public key hash as a source of pseudo-randomness
    const hash = key.public_key_hex.slice(2, 10);
    const hashNum = parseInt(hash, 16);
    return (hashNum % 10000) / 10000;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Private Key Manager</CardTitle>
            <CardDescription>Manage your recovered private keys</CardDescription>
          </div>
          <div className="flex gap-2">
            {keys.some(k => k.completed) && (
              <Button variant="outline" size="sm" onClick={exportAllKeys}>
                <Download className="h-4 w-4 mr-1" />
                Export All Keys
              </Button>
            )}
            {spentKeys.size > 0 && (
              <Button variant="outline" size="sm" onClick={clearSpentKeys}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear Spent Keys
              </Button>
            )}
            <Button variant="default" size="sm" onClick={onClose}>
              <Wallet className="h-4 w-4 mr-1" />
              Return to Wallet
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading keys...</div>
        ) : keys.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-crypto-muted flex items-center justify-center mb-4">
              <Key className="h-8 w-8 text-crypto-foreground/40" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Private Keys Available Yet</h3>
            <p className="text-crypto-foreground/70 mb-4">
              Analyze transactions to recover private keys from vulnerable signatures.
            </p>
            <Button asChild>
              <Link to="/">Analyze Transactions</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {keys.map((key) => {
                const isSpent = spentKeys.has(key.id);
                const keyBalance = key.completed ? getKeyBalance(key) : 0;
                
                return (
                  <div 
                    key={key.id} 
                    className={`border rounded-lg p-4 ${isSpent ? 'opacity-60 bg-crypto-background/30' : 'bg-crypto-muted'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        {key.completed ? (
                          <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center mr-3">
                            <Key className="h-4 w-4 text-green-500" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center mr-3">
                            <Key className="h-4 w-4 text-amber-500" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium flex items-center">
                            Private Key 
                            {key.completed && (
                              <Badge variant="outline" className="ml-2 text-green-500 border-green-500/30">
                                Complete
                              </Badge>
                            )}
                            {!key.completed && (
                              <Badge variant="outline" className="ml-2 text-amber-500 border-amber-500/30">
                                Partial
                              </Badge>
                            )}
                            {isSpent && (
                              <Badge variant="outline" className="ml-2 text-gray-500 border-gray-500/30">
                                Spent
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-crypto-foreground/70">
                            Updated: {new Date(key.updated_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      {key.completed && keyBalance > 0 && (
                        <div className="text-right">
                          <div className="font-mono font-medium">{formatBtcValue(keyBalance)} BTC</div>
                          <div className="text-xs text-crypto-foreground/70">
                            {formatUsdValue(keyBalance)}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 space-y-3">
                      <div className="space-y-1">
                        <div className="text-xs text-crypto-foreground/70">Public Key</div>
                        <div className="bg-crypto-background p-2 rounded text-xs font-mono break-all">
                          {key.public_key_hex}
                        </div>
                      </div>
                      
                      {key.completed && key.combined_fragments && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-crypto-foreground/70">Private Key</div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 py-0"
                              onClick={() => copyToClipboard(key.combined_fragments, key.id)}
                            >
                              {copiedId === key.id ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              <span className="ml-1 text-xs">Copy</span>
                            </Button>
                          </div>
                          <div className="bg-crypto-background p-2 rounded text-xs font-mono break-all">
                            {key.combined_fragments}
                          </div>
                          
                          <div className="flex mt-2 items-center space-x-1 text-xs">
                            {verifyPrivateKey(
                              key.combined_fragments, 
                              key.public_key_hex.substring(0, 66), 
                              key.public_key_hex.substring(66)
                            ) ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span className="text-green-500">Key verified</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 text-amber-500" />
                                <span className="text-amber-500">Key verification failed</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {key.completed && (
                        <div className="flex justify-end space-x-2 pt-2">
                          {!isSpent ? (
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => importKeyToWallet(key)}
                            >
                              <Wallet className="h-3 w-3 mr-1" />
                              Import Key
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Imported
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <div className="text-sm text-crypto-foreground/70">
          {keys.filter(k => k.completed).length} of {keys.length} keys fully recovered
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </CardFooter>
    </Card>
  );
};

// For React-Router Link component
const Link = ({ to, children, ...props }: { to: string; children: React.ReactNode; [key: string]: any }) => {
  return <a href={to} {...props}>{children}</a>;
};

export default KeyManagementPanel;
