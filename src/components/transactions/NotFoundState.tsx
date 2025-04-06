
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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
        <h2 className="text-xl font-semibold mb-2">{message}</h2>
        {txid && (
          <p className="text-crypto-foreground/70 font-mono text-sm mb-4 break-all">
            TXID: {txid}
          </p>
        )}
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
