
import React from 'react';
import { XCircle, RefreshCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AnalysisErrorStateProps {
  txid?: string;
  error: string;
  onRetry: () => void;
}

const AnalysisErrorState: React.FC<AnalysisErrorStateProps> = ({ txid, error, onRetry }) => {
  // Check if error is related to network or connection issues
  const isNetworkError = error.includes('fetch') || 
                        error.includes('network') || 
                        error.includes('connection') ||
                        error.includes('Failed to fetch');

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <XCircle className="h-16 w-16 text-red-500 mb-4" />
      <p className="text-red-500 font-medium mb-2">Analysis Error</p>
      <p className="text-center text-crypto-foreground/70 mb-4">{error}</p>
      
      {isNetworkError && (
        <Alert className="mb-4 max-w-md">
          <AlertTitle className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Connection Issue Detected
          </AlertTitle>
          <AlertDescription>
            There appears to be an issue connecting to the blockchain node. The application
            will use demo data for basic functionality, but for full analysis capabilities,
            please verify your network connection or configure a different node endpoint.
          </AlertDescription>
        </Alert>
      )}
      
      <Button 
        onClick={onRetry}
        className="mt-4 bg-crypto-primary hover:bg-crypto-primary/80"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
};

export default AnalysisErrorState;
