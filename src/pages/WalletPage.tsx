
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Key, PlusCircle, Wallet } from 'lucide-react';
import WalletInterface from '@/components/WalletInterface';

const WalletPage = () => {
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
        </div>
        <p className="text-crypto-foreground/70">
          Manage recovered private keys, check balances, and send transactions
        </p>
      </header>
      
      <div className="grid gap-6">
        <WalletInterface />
        
        <div className="flex justify-center mt-4">
          <Button variant="outline" asChild>
            <Link to="/keys">
              <Key className="mr-2 h-4 w-4" />
              View All Recovered Keys
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
