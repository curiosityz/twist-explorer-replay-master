
import { RefreshCw } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="min-h-screen bg-crypto-background text-crypto-foreground p-6 flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-crypto-primary" />
        <h2 className="text-xl font-semibold">Loading transaction details...</h2>
      </div>
    </div>
  );
}
