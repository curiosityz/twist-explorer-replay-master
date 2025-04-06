
import React from 'react';
import { XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalysisErrorStateProps {
  txid?: string;
  error: string;
  onRetry: () => void;
}

const AnalysisErrorState: React.FC<AnalysisErrorStateProps> = ({ txid, error, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <XCircle className="h-16 w-16 text-red-500 mb-4" />
      <p className="text-red-500 font-medium mb-2">Analysis Error</p>
      <p className="text-center text-crypto-foreground/70">{error}</p>
      <Button 
        onClick={onRetry}
        className="mt-6 bg-crypto-primary hover:bg-crypto-primary/80"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
};

export default AnalysisErrorState;
