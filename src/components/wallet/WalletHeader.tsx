
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const WalletHeader: React.FC = () => {
  return (
    <header className="mb-8">
      <div className="flex items-center mb-4">
        <Button variant="outline" size="sm" asChild className="mr-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <h1 className="text-3xl font-bold">Bitcoin Wallet</h1>
      <p className="text-crypto-foreground/70 mt-1">
        Manage and recover private keys, view balances and transactions
      </p>
    </header>
  );
};

export default WalletHeader;
