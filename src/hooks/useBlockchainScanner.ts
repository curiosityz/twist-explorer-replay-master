
import { useState, useEffect } from 'react';
import { ScanningStatus, blockchainScannerService } from '@/services/blockchainScannerService';
import { chainstackService } from '@/services/chainstackService';
import { toast } from 'sonner';

export const useBlockchainScanner = () => {
  const [scanStatus, setScanStatus] = useState<ScanningStatus>({
    isScanning: false,
    currentBlock: 0,
    startBlock: 0,
    endBlock: 0,
    processedCount: 0,
    vulnerableCount: 0,
    progress: 0
  });
  
  const [latestBlock, setLatestBlock] = useState<number>(0);
  const [isLoadingLatest, setIsLoadingLatest] = useState<boolean>(false);
  
  const [customStartBlock, setCustomStartBlock] = useState<number>(0);
  const [customEndBlock, setCustomEndBlock] = useState<number>(0);
  
  // Fetch the latest block height when component mounts
  useEffect(() => {
    fetchLatestBlockHeight();
  }, []);
  
  // Update the status periodically when scanning is active
  useEffect(() => {
    if (!scanStatus.isScanning) return;
    
    const intervalId = setInterval(() => {
      const updatedStatus = blockchainScannerService.getStatus();
      setScanStatus(updatedStatus);
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [scanStatus.isScanning]);
  
  const fetchLatestBlockHeight = async () => {
    setIsLoadingLatest(true);
    try {
      const blockHeight = await chainstackService.getBlockHeight();
      setLatestBlock(blockHeight);
      
      // Set default custom range values (a small window for testing)
      setCustomStartBlock(Math.max(blockHeight - 5, 0));
      setCustomEndBlock(blockHeight);
    } catch (error) {
      console.error('Failed to fetch latest block height:', error);
      toast.error('Failed to fetch latest block height');
    } finally {
      setIsLoadingLatest(false);
    }
  };
  
  const startScan = async (startBlock: number, endBlock: number) => {
    if (startBlock > endBlock) {
      toast.error('Start block cannot be greater than end block');
      return;
    }
    
    if (startBlock < 0 || endBlock < 0) {
      toast.error('Block height cannot be negative');
      return;
    }
    
    const blockRange = endBlock - startBlock;
    if (blockRange > 20) {
      const confirmed = window.confirm(
        `You're about to scan ${blockRange} blocks, which may take a while and use significant resources. Continue?`
      );
      if (!confirmed) return;
    }
    
    blockchainScannerService.startScanning(
      startBlock, 
      endBlock,
      (status) => setScanStatus(status)
    );
  };
  
  const stopScan = () => {
    blockchainScannerService.stopScanning();
  };
  
  return {
    scanStatus,
    latestBlock,
    isLoadingLatest,
    customStartBlock,
    customEndBlock,
    setCustomStartBlock,
    setCustomEndBlock,
    startScan,
    stopScan,
    refreshLatestBlock: fetchLatestBlockHeight
  };
};
