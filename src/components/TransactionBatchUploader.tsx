
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileUploadTab from './transactions/FileUploadTab';
import PasteUploadTab from './transactions/PasteUploadTab';
import UploadProgress from './transactions/UploadProgress';
import { extractTransactionIds } from '@/utils/transactionUtils';
import { processTransactions } from '@/services/transactionService';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

interface TransactionBatchUploaderProps {
  onTransactionSelected: (txid: string) => void;
}

const TransactionBatchUploader = ({ onTransactionSelected }: TransactionBatchUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [activeTab, setActiveTab] = useState('file');
  const [processedTxids, setProcessedTxids] = useState<string[]>([]);
  const { toast } = useToast();

  const handleProcessTransactions = async (txids: string[]) => {
    if (!txids.length) {
      toast({
        title: "No Valid Transaction IDs",
        description: "No valid Bitcoin transaction IDs were found in the input.",
        variant: "destructive",
      });
      setIsUploading(false);
      return;
    }
    
    setTotalCount(txids.length);
    setProcessedCount(0);
    setErrorCount(0);
    
    // Process transactions in batches
    const result = await processTransactions(txids);
    
    // Update UI with results
    setProcessedCount(result.processedCount);
    setErrorCount(result.errorCount);
    setProgress(100);
    
    // Store all processed txids
    setProcessedTxids(result.validTxids || []);
    
    // Select the first valid transaction for viewing if available
    if (result.firstValidTxid) {
      onTransactionSelected(result.firstValidTxid);
    }
    
    toast({
      title: "Batch Processing Complete",
      description: `Successfully processed ${result.successCount} of ${result.totalValid} transactions. ${result.totalInput - result.totalValid} skipped due to invalid format.`,
      variant: result.successCount === 0 ? "destructive" : "default",
    });
    
    setIsUploading(false);
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setProgress(0);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        const txids = extractTransactionIds(content);
        await handleProcessTransactions(txids);
      };
      
      reader.readAsText(file);
    } catch (error) {
      toast({
        title: "Error Reading File",
        description: "Failed to read the uploaded file.",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };
  
  const handlePasteUpload = async (text: string) => {
    setIsUploading(true);
    setProgress(0);
    
    try {
      const txids = extractTransactionIds(text);
      await handleProcessTransactions(txids);
    } catch (error) {
      console.error("Error processing pasted data:", error);
      toast({
        title: "Error Processing Input",
        description: "Failed to process the pasted transaction IDs.",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  return (
    <Card className="bg-crypto-muted border-crypto-border">
      <CardHeader>
        <CardTitle className="text-crypto-foreground">Batch Transaction Processor</CardTitle>
        <CardDescription className="text-crypto-foreground/70">
          Upload or paste transaction IDs for batch processing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">Upload File</TabsTrigger>
            <TabsTrigger value="paste">Paste TXIDs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="mt-4">
            <FileUploadTab 
              isUploading={isUploading}
              onUploadFile={handleFileUpload}
            />
          </TabsContent>
          
          <TabsContent value="paste" className="mt-4">
            <PasteUploadTab 
              isUploading={isUploading}
              onUploadPasted={handlePasteUpload}
            />
          </TabsContent>
        </Tabs>

        <UploadProgress 
          isUploading={isUploading}
          progress={progress}
          processedCount={processedCount}
          totalCount={totalCount}
          errorCount={errorCount}
        />
        
        {processedTxids.length > 0 && !isUploading && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Processed Transactions ({processedTxids.length})</h4>
            <ScrollArea className="h-32 rounded border border-crypto-border bg-crypto-background">
              <div className="p-2 space-y-1">
                {processedTxids.map((txid) => (
                  <Button 
                    key={txid} 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start truncate font-mono text-xs"
                    onClick={() => onTransactionSelected(txid)}
                  >
                    {txid}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionBatchUploader;
