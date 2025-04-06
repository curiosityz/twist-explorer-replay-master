
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnalysisResult } from '@/types';
import { useAnalysis } from '@/hooks/useAnalysis';
import EmptyAnalysisState from './analysis/EmptyAnalysisState';
import AnalysisLoadingState from './analysis/AnalysisLoadingState';
import AnalysisErrorState from './analysis/AnalysisErrorState';
import AnalysisResultDisplay from './analysis/AnalysisResultDisplay';
import AnalysisStartButton from './analysis/AnalysisStartButton';

interface CryptographicVisualizerProps {
  txid?: string;
  startAnalysis?: boolean;
}

const CryptographicVisualizer = ({ txid, startAnalysis = false }: CryptographicVisualizerProps) => {
  const {
    analysisResult,
    isAnalyzing,
    error,
    verificationResult,
    copied,
    privateKey,
    isDuplicate,
    handleAnalyzeTransaction,
    copyPrivateKey
  } = useAnalysis(txid, startAnalysis);

  if (!txid) {
    return (
      <Card className="bg-crypto-muted border-crypto-border h-full">
        <CardHeader>
          <CardTitle className="text-crypto-foreground">Cryptographic Analysis</CardTitle>
          <CardDescription className="text-crypto-foreground/70">
            Select a transaction to analyze
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[280px]">
          <EmptyAnalysisState />
        </CardContent>
      </Card>
    );
  }

  if (isAnalyzing) {
    return (
      <Card className="bg-crypto-muted border-crypto-border h-full">
        <CardHeader>
          <CardTitle className="text-crypto-foreground">Analyzing Transaction</CardTitle>
          <CardDescription className="text-crypto-foreground/70">
            Scanning for cryptographic vulnerabilities...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[280px]">
          <AnalysisLoadingState />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-crypto-muted border-crypto-border h-full">
        <CardHeader>
          <CardTitle className="text-crypto-foreground">Analysis Failed</CardTitle>
          <CardDescription className="text-crypto-foreground/70">
            TXID: {txid.substring(0, 8)}...{txid.substring(txid.length - 8)}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] overflow-auto">
          <AnalysisErrorState 
            txid={txid} 
            error={error} 
            onRetry={handleAnalyzeTransaction} 
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-crypto-muted border-crypto-border h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-crypto-foreground">Vulnerability Results</CardTitle>
            <CardDescription className="text-crypto-foreground/70">
              TXID: {txid?.substring(0, 8)}...{txid?.substring(txid.length - 8)}
            </CardDescription>
          </div>
          {analysisResult && (
            <Badge 
              variant={analysisResult.status === 'completed' ? 'default' : 'destructive'} 
              className="ml-auto"
            >
              {isDuplicate ? 'duplicate' : analysisResult.status}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="h-[280px] overflow-auto">
        {analysisResult ? (
          <AnalysisResultDisplay 
            analysisResult={analysisResult}
            privateKey={privateKey}
            verificationResult={verificationResult}
            isDuplicate={isDuplicate}
            copyPrivateKey={copyPrivateKey}
            copied={copied}
          />
        ) : (
          <AnalysisStartButton onStartAnalysis={handleAnalyzeTransaction} />
        )}
      </CardContent>
    </Card>
  );
};

export default CryptographicVisualizer;
