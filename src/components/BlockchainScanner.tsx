
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBlockchainScanner } from '@/hooks/useBlockchainScanner';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Play, StopCircle, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const BlockchainScanner: React.FC = () => {
  const {
    scanStatus,
    latestBlock,
    isLoadingLatest,
    customStartBlock,
    customEndBlock,
    setCustomStartBlock,
    setCustomEndBlock,
    startScan,
    stopScan,
    refreshLatestBlock
  } = useBlockchainScanner();

  const handleStartScan = () => {
    // Show a toast to inform about CORS proxy
    toast.info("Using CORS proxy for blockchain API requests", {
      description: "This helps avoid cross-origin errors when scanning the blockchain."
    });
    startScan(customStartBlock, customEndBlock);
  };

  const handleStopScan = () => {
    stopScan();
  };

  return (
    <Card className="bg-crypto-muted border-crypto-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-crypto-foreground">Blockchain Vulnerability Scanner</CardTitle>
            <CardDescription className="text-crypto-foreground/70">
              Scan the blockchain for vulnerable transactions
            </CardDescription>
          </div>
          <Badge 
            variant={scanStatus.isScanning ? 'default' : 'outline'} 
            className={scanStatus.isScanning ? 'bg-green-500 hover:bg-green-500' : ''}
          >
            {scanStatus.isScanning ? 'Scanning' : 'Idle'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-crypto-foreground">Block Range</div>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={customStartBlock}
                onChange={(e) => setCustomStartBlock(parseInt(e.target.value) || 0)}
                placeholder="Start block"
                className="w-full bg-crypto-background border-crypto-border"
                disabled={scanStatus.isScanning}
              />
              <span className="text-crypto-foreground">to</span>
              <Input
                type="number"
                value={customEndBlock}
                onChange={(e) => setCustomEndBlock(parseInt(e.target.value) || 0)}
                placeholder="End block"
                className="w-full bg-crypto-background border-crypto-border"
                disabled={scanStatus.isScanning}
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={refreshLatestBlock} 
                disabled={isLoadingLatest || scanStatus.isScanning}
                className="flex-shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingLatest ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="text-xs text-crypto-foreground/60">
              Latest block: {isLoadingLatest ? 'Loading...' : latestBlock.toLocaleString()}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-crypto-foreground">Scanner Controls</div>
            <div className="flex items-center space-x-2">
              {!scanStatus.isScanning ? (
                <Button 
                  onClick={handleStartScan} 
                  className="w-full bg-crypto-primary hover:bg-crypto-primary/80"
                  disabled={customStartBlock <= 0 || customEndBlock <= 0}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Scan
                </Button>
              ) : (
                <Button 
                  onClick={handleStopScan} 
                  variant="destructive" 
                  className="w-full"
                >
                  <StopCircle className="mr-2 h-4 w-4" />
                  Stop Scan
                </Button>
              )}
            </div>
            <div className="text-xs text-crypto-foreground/60">
              {scanStatus.isScanning ? (
                `Scanning block ${scanStatus.currentBlock.toLocaleString()} of ${scanStatus.endBlock.toLocaleString()}`
              ) : 'Scanner ready'}
            </div>
          </div>
        </div>

        {scanStatus.isScanning && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-crypto-foreground/80">
              <span>Progress: {Math.round(scanStatus.progress)}%</span>
              <span>Block {scanStatus.currentBlock.toLocaleString()} / {scanStatus.endBlock.toLocaleString()}</span>
            </div>
            <Progress value={scanStatus.progress} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-crypto-background border border-crypto-border rounded p-3">
            <div className="text-sm font-medium mb-1">Blocks Scanned</div>
            <div className="text-xl font-mono">
              {scanStatus.isScanning ? (
                scanStatus.currentBlock - scanStatus.startBlock
              ) : 0}
            </div>
          </div>
          <div className="bg-crypto-background border border-crypto-border rounded p-3">
            <div className="text-sm font-medium mb-1">Transactions Processed</div>
            <div className="text-xl font-mono">{scanStatus.processedCount.toLocaleString()}</div>
          </div>
          <div className="bg-crypto-background border border-crypto-border rounded p-3">
            <div className="text-sm font-medium mb-1">Vulnerabilities Found</div>
            <div className="text-xl font-mono text-amber-500">{scanStatus.vulnerableCount.toLocaleString()}</div>
          </div>
        </div>

        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5" />
            <div>
              <p>Using CORS proxy to access blockchain data. This may slow down scanning but helps avoid cross-origin errors.</p>
            </div>
          </div>
        </div>
      </CardContent>
      {!scanStatus.isScanning && (
        <CardFooter className="text-xs text-crypto-foreground/60 border-t border-crypto-border pt-4">
          <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
          Warning: Scanning large block ranges may consume significant resources and take time.
        </CardFooter>
      )}
    </Card>
  );
};

export default BlockchainScanner;
