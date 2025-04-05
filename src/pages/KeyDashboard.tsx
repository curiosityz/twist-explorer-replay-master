
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase, Tables } from '@/integrations/supabase/client';
import { ArrowLeft, Check, Copy, Database, Key, Lock, Unlock, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { combinePrivateKeyFragments } from '@/lib/cryptoUtils';
import { toast } from 'sonner';

const KeyDashboard = () => {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchKeys = async () => {
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from(Tables.private_key_fragments)
          .select('*')
          .order('updated_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching keys:', error);
          setLoading(false);
          return;
        }
        
        setKeys(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchKeys();
  }, []);

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
      recovered: format(new Date(key.updated_at), 'yyyy-MM-dd HH:mm:ss'),
    }));
    
    const dataStr = JSON.stringify(keysData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `crypto-recovery-keys-${format(new Date(), 'yyyyMMdd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success(`Exported ${keysData.length} keys`);
  };

  return (
    <div className="min-h-screen bg-crypto-background text-crypto-foreground p-6">
      <header className="mb-8">
        <div className="flex items-center mb-4">
          <Button variant="outline" size="sm" asChild className="mr-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Recovered Private Keys</h1>
          
          <div className="ml-auto flex space-x-2">
            <Button variant="outline" size="sm" onClick={exportAllKeys}>
              <Copy className="h-4 w-4 mr-1" />
              Export All
            </Button>
            
            <Button variant="default" size="sm" asChild>
              <Link to="/wallet">
                <Wallet className="h-4 w-4 mr-1" />
                Open Wallet
              </Link>
            </Button>
          </div>
        </div>
        <p className="text-crypto-foreground/70">
          View all private key fragments and recovered private keys
        </p>
      </header>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Private Keys
          </CardTitle>
          <CardDescription>
            {keys.filter(k => k.completed).length} of {keys.length} keys fully recovered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-crypto-foreground/70">
              Loading keys...
            </div>
          ) : keys.length === 0 ? (
            <div className="py-8 text-center text-crypto-foreground/70">
              No private key fragments have been collected yet.
              <div className="mt-4">
                <Button asChild>
                  <Link to="/">
                    Analyze Transactions
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {keys.map((key) => (
                <div key={key.id} className="border border-crypto-border rounded-md p-4 bg-crypto-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      {key.completed ? (
                        <Unlock className="h-5 w-5 mr-2 text-green-400" />
                      ) : (
                        <Lock className="h-5 w-5 mr-2 text-amber-400" />
                      )}
                      <span className="font-mono text-sm truncate max-w-[240px]">
                        {key.public_key_hex.substring(0, 16)}...
                      </span>
                    </div>
                    <Badge variant={key.completed ? "default" : "secondary"} className="font-mono text-xs">
                      {key.completed ? 'Recovered' : 'Partial'}
                    </Badge>
                  </div>
                  
                  <div className="text-sm mb-3">
                    <div><span className="text-crypto-foreground/70">Fragments:</span> {Object.keys(key.modulo_values).length}</div>
                    <div><span className="text-crypto-foreground/70">Updated:</span> {format(new Date(key.updated_at), 'MMM dd, yyyy HH:mm')}</div>
                  </div>
                  
                  {key.completed && key.combined_fragments && (
                    <div className="mt-4 p-3 bg-crypto-background rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-crypto-foreground/70">Private Key (hex)</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 p-0 px-2"
                          onClick={() => copyToClipboard(key.combined_fragments, key.id)}
                        >
                          {copiedId === key.id ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                      <div className="font-mono text-xs break-all text-crypto-accent">
                        {key.combined_fragments}
                      </div>
                    </div>
                  )}
                  
                  {!key.completed && (
                    <div className="mt-3 text-xs text-crypto-foreground/70 italic">
                      More fragments needed to recover complete private key
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KeyDashboard;
