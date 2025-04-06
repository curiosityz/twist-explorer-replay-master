
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search } from 'lucide-react';

interface NotFoundStateProps {
  txid?: string;
  message?: string;
}

export function NotFoundState({ 
  txid = '', 
  message = 'Transaction not found' 
}: NotFoundStateProps) {
  return (
    <div className="p-6">
      <div className="text-center">
        <Search className="h-12 w-12 text-crypto-foreground/30 mx-auto mb-3" />
        <h2 className="text-xl font-semibold mb-2">{message}</h2>
        {txid && (
          <p className="text-crypto-foreground/70 font-mono text-sm mb-4 break-all">
            TXID: {txid}
          </p>
        )}
        <p className="text-sm text-crypto-foreground/70 mb-4">
          The requested transaction could not be found in the database. 
          You may need to import it first.
        </p>
        <Button asChild>
          <Link to="/transactions">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Transactions
          </Link>
        </Button>
      </div>
    </div>
  );
}
