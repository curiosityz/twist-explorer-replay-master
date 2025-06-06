
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBlockchainScanner } from '@/hooks/useBlockchainScanner';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Play, StopCircle, AlertTriangle, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ConnectionPanel from './ConnectionPanel';

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
    refreshLatestBlock,
    nodeConfig,
    setNodeConfig
  } = useBlockchainScanner();

  const handleStartScan = () => {
    startScan(customStartBlock, customEndBlock);
  };

  const handleStopScan = () => {
    stopScan();
  };

  return (
    <div className="space-y-6">
      {/* Connection Panel */}
      <ConnectionPanel onConnect={(config) => setNodeConfig(config)} />
      
      {/* Scanner Panel */}
      <Card className="bg-crypto-muted border-crypto-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-crypto-foreground">Blockchain Vulnerability Scanner</CardTitle>
              <CardDescription className="text-crypto-foreground/70">
                Scan the blockchain for vulnerable cryptographic transactions
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
                  disabled={scanStatus.isScanning || !nodeConfig?.connected}
                />
                <span className="text-crypto-foreground">to</span>
                <Input
                  type="number"
                  value={customEndBlock}
                  onChange={(e) => setCustomEndBlock(parseInt(e.target.value) || 0)}
                  placeholder="End block"
                  className="w-full bg-crypto-background border-crypto-border"
                  disabled={scanStatus.isScanning || !nodeConfig?.connected}
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={refreshLatestBlock} 
                  disabled={isLoadingLatest || scanStatus.isScanning || !nodeConfig?.connected}
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
                    disabled={customStartBlock <= 0 || customEndBlock <= 0 || !nodeConfig?.connected}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Cryptographic Scan
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
                {!nodeConfig?.connected ? 'Connect to node first' : 
                  scanStatus.isScanning ? 
                  `Scanning block ${scanStatus.currentBlock.toLocaleString()} of ${scanStatus.endBlock.toLocaleString()}` : 
                  'Crypto scanner ready'
                }
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
            <div className="bg-crypto-background border border-crypto-border rounded p-3 relative overflow-hidden">
              <div className={`absolute inset-0 bg-amber-500/10 ${scanStatus.vulnerableCount > 0 ? 'opacity-100' : 'opacity-0'} transition-opacity`}></div>
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-medium">Vulnerabilities Found</div>
                {scanStatus.vulnerableCount > 0 && <Shield className="h-4 w-4 text-amber-500" />}
              </div>
              <div className="text-xl font-mono text-amber-500">{scanStatus.vulnerableCount.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
        {!scanStatus.isScanning && (
          <CardFooter className="text-xs text-crypto-foreground/60 border-t border-crypto-border pt-4">
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
            Note: Cryptographic scanning analyzes SegWit transaction signatures for twisted curve vulnerabilities.
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default BlockchainScanner;
