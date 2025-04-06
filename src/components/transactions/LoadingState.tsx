
import { RefreshCw } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading transaction details..." }: LoadingStateProps) {
  return (
    <div className="p-6 flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-crypto-primary" />
        <h2 className="text-xl font-semibold">{message}</h2>
      </div>
    </div>
  );
}
