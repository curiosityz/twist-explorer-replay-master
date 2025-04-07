
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WalletActionCardProps {
  onShowImport: () => void;
}

const WalletActionCard: React.FC<WalletActionCardProps> = ({ onShowImport }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-crypto-foreground">Wallet Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button 
            variant="default" 
            className="w-full"
            onClick={onShowImport}
          >
            Import Private Key
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            asChild
          >
            <Link to="/keys">
              View Recovered Keys
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletActionCard;
