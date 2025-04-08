import React from 'react';
import { XCircle, RefreshCw, Settings, Globe, KeySquare, Database, Search, FileCode, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AnalysisErrorStateProps {
  txid?: string;
  error: string;
  onRetry: () => void;
}

const AnalysisErrorState: React.FC<AnalysisErrorStateProps> = ({ txid, error, onRetry }) => {
  // Enhanced error type detection
  const isNetworkError = error.includes('fetch') || 
                         error.includes('network') || 
                         error.includes('connection') ||
                         error.includes('Failed to fetch');
  
  const isCorsError = error.includes('CORS') || 
                      error.includes('blocked by CORS policy') || 
                      error.includes('Access-Control-Allow-Origin');

  const isAuthError = error.includes('401') || 
                      error.includes('Unauthorized') || 
                      error.includes('Authentication');
                      
  const isDataExtractionError = error.includes('extract') && 
                               error.includes('cryptographic data');
                               
  const isNotFoundError = error.includes('404') || 
                         error.includes('not found') || 
                         error.includes('Not Found');
                         
  const isParseError = error.includes('parse') ||
                      error.includes('invalid format') ||
                      error.includes('unsupported');
                      
  const isCryptoError = error.includes('secp256k1') ||
                       error.includes('curve') ||
                       error.includes('key') ||
                       error.includes('signature');

  const isAddressError = error.includes('address validation') ||
                        error.includes('invalid address');

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
      
      {isAuthError && (
        <Alert className="mb-4 max-w-md">
          <AlertTitle className="flex items-center">
            <Database className="mr-2 h-4 w-4" />
            Database Authentication Error
          </AlertTitle>
          <AlertDescription>
            There was an issue authenticating with the database. This could be due to
            invalid or expired API keys. Please check your database configuration.
          </AlertDescription>
        </Alert>
      )}
      
      {isDataExtractionError && (
        <Alert className="mb-4 max-w-md">
          <AlertTitle className="flex items-center">
            <KeySquare className="mr-2 h-4 w-4" />
            Cryptographic Data Extraction Issue
          </AlertTitle>
          <AlertDescription>
            The system was unable to extract valid cryptographic data from this transaction.
            This may be because the transaction uses a format we don't currently support,
            or doesn't contain the specific signature data we're looking for.
          </AlertDescription>
        </Alert>
      )}
      
      {isNotFoundError && (
        <Alert className="mb-4 max-w-md">
          <AlertTitle className="flex items-center">
            <Search className="mr-2 h-4 w-4" />
            Transaction Not Found
          </AlertTitle>
          <AlertDescription>
            The requested transaction could not be found on the blockchain.
            Please verify that you entered the correct transaction ID.
          </AlertDescription>
        </Alert>
      )}
      
      {isParseError && (
        <Alert className="mb-4 max-w-md">
          <AlertTitle className="flex items-center">
            <FileCode className="mr-2 h-4 w-4" />
            Transaction Parsing Error
          </AlertTitle>
          <AlertDescription>
            There was an issue parsing the transaction data. The format might be 
            unsupported or invalid. This tool currently supports P2PKH (legacy) 
            and P2WPKH (SegWit) transactions.
          </AlertDescription>
        </Alert>
      )}

      {isCryptoError && (
        <Alert className="mb-4 max-w-md">
          <AlertTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Cryptographic Operation Error
          </AlertTitle>
          <AlertDescription>
            There was an issue performing a cryptographic operation.
            This might indicate an issue with the elliptic curve operations or key validation.
          </AlertDescription>
        </Alert>
      )}

      {isAddressError && (
        <Alert className="mb-4 max-w-md">
          <AlertTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Address Validation Error
          </AlertTitle>
          <AlertDescription>
            The Bitcoin address format is invalid or unsupported.
            Please check the address format and try again.
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
