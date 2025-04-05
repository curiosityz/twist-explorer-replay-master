
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Key, PlusCircle, Wallet } from 'lucide-react';
import WalletInterface from '@/components/WalletInterface';
import ConnectionPanel from '@/components/ConnectionPanel';
import KeyManagementPanel from '@/components/KeyManagementPanel';
import { NodeConfiguration } from '@/types';
import { chainstackService } from '@/services/chainstackService';
import { toast } from 'sonner';

const WalletPage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [nodeConfig, setNodeConfig] = useState<NodeConfiguration | null>(null);
  const [showKeyManagement, setShowKeyManagement] = useState(false);

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
