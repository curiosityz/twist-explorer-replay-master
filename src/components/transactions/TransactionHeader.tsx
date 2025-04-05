
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface TransactionHeaderProps {
  txid: string | undefined;
  status?: string;
}

export function TransactionHeader({ txid, status }: TransactionHeaderProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'analyzing': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <header className="mb-8">
      <div className="flex items-center mb-4">
        <Button variant="outline" size="sm" asChild className="mr-2">
          <Link to="/transactions">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Transactions
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Transaction Details</h1>
        {status && (
          <Badge 
            variant={getStatusBadgeVariant(status)} 
            className="ml-3 font-mono text-xs"
          >
            {status}
          </Badge>
        )}
      </div>
      {txid && (
        <p className="text-crypto-foreground/70 font-mono text-sm break-all">
          TXID: {txid}
        </p>
      )}
    </header>
  );
}
