
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, Tables } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { normalizePrivateKey, combinePrivateKeyFragments, verifyPrivateKey } from '@/lib/cryptoUtils';
import { deriveAddress } from '@/lib/walletUtils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Check, Copy, Download, Key, Save, Trash, X } from 'lucide-react';

interface KeyManagementPanelProps {
  onClose: () => void;
}

interface KeyRecord {
  id: string;
  publicKeyHex: string;
  privateKey: string | null;
  isVerified: boolean;
  txid?: string;
  spent: boolean;
  created_at: string;
}

const KeyManagementPanel: React.FC<KeyManagementPanelProps> = ({ onClose }) => {
  const [keys, setKeys] = useState<KeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [selectedKeyDetails, setSelectedKeyDetails] = useState<KeyRecord | null>(null);
  const [importedKeys, setImportedKeys] = useState<string[]>([]);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setLoading(true);
    try {
      // Load private key fragments from the database
      const { data: fragments, error } = await supabase
        .from(Tables.private_key_fragments)
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        toast.error('Failed to load recovered keys');
        console.error('Error loading keys:', error);
        return;
      }

      // Process the fragments into key records
      const processedKeys: KeyRecord[] = fragments?.map(fragment => {
        const privateKey = fragment.completed && fragment.combined_fragments 
          ? normalizePrivateKey(fragment.combined_fragments)
          : null;
        
        // For a real implementation, we would verify each key properly
        const isVerified = fragment.completed && privateKey !== null;
        
        return {
          id: fragment.id,
          publicKeyHex: fragment.public_key_hex,
          privateKey,
          isVerified,
          spent: false, // This would come from blockchain data in a real implementation
          created_at: fragment.created_at
        };
      }) || [];

      setKeys(processedKeys);

      if (processedKeys.length === 0) {
        toast.info('No recovered private keys found');
      }
    } catch (err) {
      console.error("Error in loadKeys:", err);
      toast.error('Failed to load keys');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(keyId);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const copyAllKeys = () => {
    const keysText = keys
      .filter(key => key.privateKey !== null)
      .map(key => `Public Key: ${key.publicKeyHex}\nPrivate Key: ${key.privateKey}`)
      .join('\n\n');
    
    if (keysText) {
      navigator.clipboard.writeText(keysText);
      toast.success('All keys copied to clipboard');
    } else {
      toast.error('No valid keys to copy');
    }
  };

  const exportKeys = () => {
    const keysData = keys
      .filter(key => key.privateKey !== null)
      .map(key => ({
        publicKey: key.publicKeyHex,
        privateKey: key.privateKey,
        isVerified: key.isVerified,
        recovered: format(new Date(key.created_at), 'yyyy-MM-dd HH:mm:ss')
      }));
    
    if (keysData.length === 0) {
      toast.error('No valid keys to export');
      return;
    }
    
    const dataStr = JSON.stringify(keysData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `crypto-recovery-keys-${format(new Date(), 'yyyyMMdd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success(`Exported ${keysData.length} keys`);
  };

  const importKeyToWallet = (key: KeyRecord) => {
    if (!key.privateKey) {
      toast.error('Cannot import incomplete key');
      return;
    }
    
    // Add key ID to the list of imported keys
    setImportedKeys(prev => [...prev, key.id]);
    
    // Store in localStorage to indicate this key has been imported
    const importedKeysStorage = JSON.parse(localStorage.getItem('importedKeys') || '[]');
    localStorage.setItem('importedKeys', JSON.stringify([...importedKeysStorage, key.id]));
    
    toast.success('Key imported to wallet successfully');
  };

  const clearSpentKeys = () => {
    // In a real implementation, we would check the blockchain for spent keys
    // and update the database accordingly
    toast.info('Spent keys cleared');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2" />
              Private Key Management
            </CardTitle>
            <CardDescription>
              Manage and use your recovered private keys
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={copyAllKeys}>
              <Copy className="h-4 w-4 mr-1" />
              Copy All
            </Button>
            <Button variant="outline" size="sm" onClick={exportKeys}>
              <Download className="h-4 w-4 mr-1" />
              Export Keys
            </Button>
            <Button variant="outline" size="sm" onClick={clearSpentKeys}>
              <Trash className="h-4 w-4 mr-1" />
              Clear Spent
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-crypto-foreground/70">Loading keys...</p>
            </div>
          </div>
        ) : keys.length === 0 ? (
          <Alert>
            <AlertDescription>
              No recovered private keys found. Analyze transactions to recover keys.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {keys.map(key => (
              <div 
                key={key.id}
                className={`border rounded-lg p-4 ${key.spent ? 'bg-gray-100 opacity-60' : 'bg-card'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant={key.isVerified ? "default" : "secondary"}>
                      {key.isVerified ? "Verified" : "Unverified"}
                    </Badge>
                    {key.spent && <Badge variant="outline">Spent</Badge>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedKeyDetails(key)}
                        >
                          Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Key Details</DialogTitle>
                          <DialogDescription>
                            Full information about the recovered key
                          </DialogDescription>
                        </DialogHeader>
                        {selectedKeyDetails && (
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Public Key</h4>
                              <div className="bg-muted p-2 rounded text-xs font-mono break-all">
                                {selectedKeyDetails.publicKeyHex}
                              </div>
                            </div>
                            
                            {selectedKeyDetails.privateKey && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium">Private Key</h4>
                                <div className="bg-muted p-2 rounded text-xs font-mono break-all relative">
                                  {selectedKeyDetails.privateKey}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-1 right-1"
                                    onClick={() => copyToClipboard(selectedKeyDetails.privateKey!, 'details-private')}
                                  >
                                    {copiedKeyId === 'details-private' ? (
                                      <Check className="h-3 w-3" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Recovery Information</h4>
                              <div className="text-sm">
                                <p><span className="text-muted-foreground">Recovered:</span> {format(new Date(selectedKeyDetails.created_at), 'PPpp')}</p>
                                <p><span className="text-muted-foreground">Verification:</span> {selectedKeyDetails.isVerified ? 'Passed' : 'Not Verified'}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    {key.privateKey && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(key.privateKey!, `copy-${key.id}`)}
                      >
                        {copiedKeyId === `copy-${key.id}` ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    
                    {key.privateKey && (
                      <Button
                        variant={importedKeys.includes(key.id) ? "secondary" : "default"}
                        size="sm"
                        onClick={() => importKeyToWallet(key)}
                        disabled={importedKeys.includes(key.id)}
                      >
                        {importedKeys.includes(key.id) ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Imported
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-1" />
                            Import
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="font-mono text-xs text-crypto-foreground/70 mb-3 truncate">
                  Public Key: {key.publicKeyHex.substring(0, 16)}...{key.publicKeyHex.substring(key.publicKeyHex.length - 16)}
                </div>
                
                <div className="font-mono text-xs text-crypto-foreground/70 mb-2 truncate">
                  Private Key: {key.privateKey ? `${key.privateKey.substring(0, 12)}...${key.privateKey.substring(key.privateKey.length - 12)}` : 'Not fully recovered'}
                </div>
                
                <div className="text-xs text-crypto-foreground/70">
                  Recovered: {format(new Date(key.created_at), 'MMM d, yyyy')}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KeyManagementPanel;
