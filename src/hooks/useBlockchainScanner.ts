
import { useState, useEffect } from 'react';
import { ScanningStatus, blockchainScannerService } from '@/services/blockchainScannerService';
import { NodeConfiguration } from '@/types';
import { chainstackService, initializeChainStack } from '@/services/chainstackService';
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
  
  const [nodeConfig, setNodeConfig] = useState<NodeConfiguration | null>(null);
  
  // Update chainstack service when node config changes
  useEffect(() => {
    if (nodeConfig && nodeConfig.connected) {
      console.log("Setting up custom ChainStack service with:", {
        rpcUrl: nodeConfig.rpcUrl,
        hasApiKey: !!nodeConfig.apiKey
      });
      
      // Create a new custom ChainStack service with the node configuration
      const customChainstack = initializeChainStack({
        rpcUrl: nodeConfig.rpcUrl,
        apiKey: nodeConfig.apiKey
      });
      
      // Set this custom chainstack service for the blockchain scanner
      blockchainScannerService.setChainStackService(customChainstack);
      
      // Update start and end blocks based on last sync block if available
      if (nodeConfig.lastSyncBlock) {
        const lastBlockHeight = nodeConfig.lastSyncBlock;
        setCustomStartBlock(Math.max(lastBlockHeight - 10, 0));
        setCustomEndBlock(lastBlockHeight);
        setLatestBlock(lastBlockHeight);
      }
      
      // Fetch latest block height with the new configuration
      fetchLatestBlockHeight(customChainstack);
      
      toast.success(`Connected to ${nodeConfig.name}`, {
        description: `Using node at ${nodeConfig.rpcUrl}`
      });
    }
  }, [nodeConfig]);
  
  // Fetch the latest block height when component mounts
  useEffect(() => {
    if (nodeConfig?.connected) {
      fetchLatestBlockHeight();
    }
  }, [nodeConfig?.connected]);
  
  // Update the status periodically when scanning is active
  useEffect(() => {
    if (!scanStatus.isScanning) return;
    
    const intervalId = setInterval(() => {
      const updatedStatus = blockchainScannerService.getStatus();
      
      // Add toast notification when vulnerabilities are found
      if (updatedStatus.vulnerableCount > scanStatus.vulnerableCount) {
        const newVulnerabilities = updatedStatus.vulnerableCount - scanStatus.vulnerableCount;
        toast.success(`${newVulnerabilities} new vulnerable transaction${newVulnerabilities > 1 ? 's' : ''} found!`, {
          description: "Check the transactions page for details",
          duration: 5000
        });
      }
      
      setScanStatus(updatedStatus);
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [scanStatus.isScanning, scanStatus.vulnerableCount]);
  
  const fetchLatestBlockHeight = async (chainService = nodeConfig?.connected ? undefined : chainstackService) => {
    if (!nodeConfig?.connected && !chainService) {
      console.log("No connected node or chain service provided");
      return; 
    }
    
    const serviceToUse = chainService || initializeChainStack({
      rpcUrl: nodeConfig!.rpcUrl,
      apiKey: nodeConfig!.apiKey
    });
    
    setIsLoadingLatest(true);
    try {
      console.log(`Fetching latest block height from ${serviceToUse.rpcUrl || 'default endpoint'}`);
      const blockHeight = await serviceToUse.getBlockHeight();
      setLatestBlock(blockHeight);
      
      // Set default custom range values (a small window for testing)
      setCustomStartBlock(Math.max(blockHeight - 5, 0));
      setCustomEndBlock(blockHeight);
      
      console.log(`Latest block height: ${blockHeight}`);
      toast.info(`Latest block height: ${blockHeight}`);
    } catch (error) {
      console.error('Failed to fetch latest block height:', error);
      toast.error('Failed to fetch latest block height', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoadingLatest(false);
    }
  };
  
  const startScan = async (startBlock: number, endBlock: number) => {
    if (!nodeConfig?.connected) {
      toast.error('Please connect to a node first');
      return;
    }
    
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
    
    console.log(`Starting scan from block ${startBlock} to ${endBlock}`);
    toast.info("Starting blockchain scan", {
      description: `Scanning for vulnerable transactions in blocks ${startBlock}-${endBlock}`,
      duration: 5000
    });
    
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
    refreshLatestBlock: () => fetchLatestBlockHeight(),
    nodeConfig,
    setNodeConfig
  };
};
