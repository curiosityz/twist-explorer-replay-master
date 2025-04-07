
import React from 'react';
import { XCircle, RefreshCw, Settings, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AnalysisErrorStateProps {
  txid?: string;
  error: string;
  onRetry: () => void;
}

const AnalysisErrorState: React.FC<AnalysisErrorStateProps> = ({ txid, error, onRetry }) => {
  // Check if error is related to network, connection, or CORS issues
  const isNetworkError = error.includes('fetch') || 
                         error.includes('network') || 
                         error.includes('connection') ||
                         error.includes('Failed to fetch');
  
  const isCorsError = error.includes('CORS') || 
                      error.includes('blocked by CORS policy') || 
                      error.includes('Access-Control-Allow-Origin');

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <XCircle className="h-16 w-16 text-red-500 mb-4" />
      <p className="text-red-500 font-medium mb-2">Analysis Error</p>
      <p className="text-center text-crypto-foreground/70 mb-4">{error}</p>
      
      {isCorsError && (
        <Alert className="mb-4 max-w-md">
          <AlertTitle className="flex items-center">
            <Globe className="mr-2 h-4 w-4" />
            CORS Restriction Error
          </AlertTitle>
          <AlertDescription>
            The application cannot directly access the blockchain API due to browser security restrictions.
            Please use a properly configured node or API endpoint that allows cross-origin requests.
          </AlertDescription>
        </Alert>
      )}
      
      {isNetworkError && !isCorsError && (
        <Alert className="mb-4 max-w-md">
          <AlertTitle className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Blockchain Connection Issue
          </AlertTitle>
          <AlertDescription>
            There appears to be an issue connecting to the blockchain node.
            Please verify your network connection or configure a different node endpoint
            to continue with transaction analysis.
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
