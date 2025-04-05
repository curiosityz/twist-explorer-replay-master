
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Key, PlusCircle, Wallet, Download, Trash2 } from 'lucide-react';
import WalletInterface from '@/components/WalletInterface';
import ConnectionPanel from '@/components/ConnectionPanel';
import KeyManagementPanel from '@/components/KeyManagementPanel';
import { NodeConfiguration, PrivateKeyFragment } from '@/types';
import { chainstackService } from '@/services/chainstackService';
import { toast } from 'sonner';
import { supabase, Tables } from '@/integrations/supabase/client';

const WalletPage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [nodeConfig, setNodeConfig] = useState<NodeConfiguration | null>(null);
  const [showKeyManagement, setShowKeyManagement] = useState(false);
  const [keyCount, setKeyCount] = useState<number>(0);
  const [completedKeyCount, setCompletedKeyCount] = useState<number>(0);

  useEffect(() => {
    // Fetch key count on component mount
    fetchKeyCount();
  }, []);

  const fetchKeyCount = async () => {
    try {
      const { data: keyData, error } = await supabase
        .from(Tables.private_key_fragments)
        .select('*');
      
      if (error) {
        console.error('Error fetching keys:', error);
        return;
      }

      setKeyCount(keyData?.length || 0);
      setCompletedKeyCount(keyData?.filter(key => key.completed).length || 0);
    } catch (error) {
      console.error('Failed to fetch key count:', error);
    }
  };

  const handleConnect = (config: NodeConfiguration) => {
    try {
      // Initialize ChainStack service with the provided configuration
      const chainstack = chainstackService.initializeWithConfig({
        rpcUrl: config.rpcUrl,
        apiKey: config.apiKey || '' // Ensure API key is never undefined
      });
      
      setNodeConfig(config);
      setIsConnected(true);
      toast.success(`Connected to ${config.name} successfully`);
    } catch (error) {
      console.error('Failed to connect to node:', error);
      toast.error('Failed to connect to blockchain node');
    }
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
          <h1 className="text-2xl font-bold flex items-center">
            <Wallet className="h-6 w-6 mr-2" />
            Crypto Wallet
          </h1>
          
          {isConnected && (
            <Button 
              variant={showKeyManagement ? "secondary" : "outline"} 
              size="sm" 
              className="ml-auto"
              onClick={() => setShowKeyManagement(!showKeyManagement)}
            >
              <Key className="h-4 w-4 mr-1" />
              {showKeyManagement ? "Hide Key Manager" : "Available Private Keys"} 
              {!showKeyManagement && completedKeyCount > 0 && (
                <span className="ml-1.5 bg-green-500 text-white rounded-full px-1.5 text-xs">
                  {completedKeyCount}
                </span>
              )}
            </Button>
          )}
        </div>
        <p className="text-crypto-foreground/70">
          Manage recovered private keys, check balances, and send transactions
        </p>
      </header>
      
      <div className="grid gap-6">
        {!isConnected ? (
          <ConnectionPanel onConnect={handleConnect} />
        ) : showKeyManagement ? (
          <KeyManagementPanel onClose={() => setShowKeyManagement(false)} />
        ) : (
          <WalletInterface />
        )}
      </div>
    </div>
  );
};

export default WalletPage;
