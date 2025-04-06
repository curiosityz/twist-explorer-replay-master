
import { RefreshCw } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  txid?: string;
}

export function LoadingState({ 
  message = "Loading transaction details...",
  txid = undefined 
}: LoadingStateProps) {
  return (
    <div className="p-6 flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-crypto-primary" />
        <h2 className="text-xl font-semibold">{message}</h2>
        {txid && (
          <p className="text-sm text-crypto-foreground/70 mt-2">
            TXID: {txid.substring(0, 8)}...{txid.substring(txid.length - 8)}
          </p>
        )}
        <p className="text-sm text-crypto-foreground/70 mt-3">
          Scanning for cryptographic vulnerabilities...
        </p>
      </div>
    </div>
  );
}
