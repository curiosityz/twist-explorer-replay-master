
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, AlertCircle, FileJson } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TransactionBatchUploaderProps {
  onTransactionSelected: (txid: string) => void;
}

const TransactionBatchUploader = ({ onTransactionSelected }: TransactionBatchUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [pasteInput, setPasteInput] = useState('');
  const [activeTab, setActiveTab] = useState('file');
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const extractTransactionIds = (input: string | any[]): string[] => {
    // If input is already an array
    if (Array.isArray(input)) {
      return input
        .map(item => {
          // If array contains objects with txid
          if (item && typeof item === 'object' && 'txid' in item) {
            return item.txid;
          }
          // If array contains strings (direct txids)
          if (typeof item === 'string') {
            return item;
          }
          return null;
        })
        .filter(Boolean) as string[];
    }
    
    // If input is a string, try to parse it
    if (typeof input === 'string') {
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(input);
        return extractTransactionIds(parsed);
      } catch (e) {
        // Not valid JSON, try to extract as plain text list
        // Split by common delimiters and filter valid txid format
        return input
          .split(/[\s,\n]+/)
          .map(line => line.trim())
          .filter(line => /^[a-fA-F0-9]{64}$/.test(line));
      }
    }
    
    // If input is an object
    if (input && typeof input === 'object') {
      // If it has a transactions array
      if ('transactions' in input && Array.isArray(input.transactions)) {
        return extractTransactionIds(input.transactions);
      }
      
      // If it has a txid property directly
      if ('txid' in input && typeof input.txid === 'string') {
        return [input.txid];
      }
      
      // If it's some other object format, try to find txids in values
      return Object.values(input)
        .flatMap(val => {
          if (Array.isArray(val)) return extractTransactionIds(val);
          if (val && typeof val === 'object') return extractTransactionIds(val);
          if (typeof val === 'string' && /^[a-fA-F0-9]{64}$/.test(val)) return [val];
          return [];
        });
    }
    
    return [];
  };
  
  const isValidTxid = (txid: string): boolean => {
    // Basic validation: check if it's a valid hex string of 64 characters (32 bytes)
    return /^[a-fA-F0-9]{64}$/.test(txid);
  };

  const processTransactionIds = async (txids: string[]) => {
    if (!txids.length) {
      toast({
        title: "No Valid Transaction IDs",
        description: "No valid Bitcoin transaction IDs were found in the input.",
        variant: "destructive",
      });
      setIsUploading(false);
      return;
    }
    
    // Validate and filter transaction IDs
    const validTxids = txids.filter(isValidTxid);
    
    if (validTxids.length === 0) {
      toast({
        title: "Invalid Transaction IDs",
        description: "No valid Bitcoin transaction IDs were found in the input.",
        variant: "destructive",
      });
      setIsUploading(false);
      return;
    }
    
    setTotalCount(validTxids.length);
    setProcessedCount(0);
    setErrorCount(0);
    
    let successCount = 0;
    
    for (let i = 0; i < validTxids.length; i++) {
      const txid = validTxids[i];
      
      try {
        // Store transaction ID in database
        const { error } = await supabase
          .from('blockchain_transactions')
          .upsert({
            txid: txid,
            chain: 'BTC',
            processed: false
          }, { onConflict: 'txid' });

        if (error) {
          console.error('Error storing transaction:', error);
          setErrorCount(prev => prev + 1);
        } else {
          successCount++;
          setProcessedCount(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error processing transaction:', error);
        setErrorCount(prev => prev + 1);
      } finally {
        setProgress(Math.round(((i + 1) / validTxids.length) * 100));
      }
    }

    // Select the first valid transaction for viewing
    if (validTxids.length > 0) {
      onTransactionSelected(validTxids[0]);
    }
    
    toast({
      title: "Batch Processing Complete",
      description: `Successfully processed ${successCount} of ${validTxids.length} transactions. ${txids.length - validTxids.length} skipped due to invalid format.`,
      variant: successCount === 0 ? "destructive" : "default",
    });
    
    setIsUploading(false);
  };

  const handleFileUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setProgress(0);
    setErrorCount(0);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        const txids = extractTransactionIds(content);
        await processTransactionIds(txids);
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
  
  const handlePasteUpload = async () => {
    if (!pasteInput.trim()) {
      toast({
        title: "Empty Input",
        description: "Please paste transaction IDs before processing.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    setProgress(0);
    setErrorCount(0);
    
    try {
      const txids = extractTransactionIds(pasteInput);
      await processTransactionIds(txids);
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
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="transaction-file" className="text-sm font-medium">
                Transaction File
              </label>
              <div className="flex gap-2">
                <input
                  id="transaction-file"
                  type="file"
                  accept=".json,.txt"
                  onChange={handleFileChange}
                  className="flex h-10 w-full rounded-md border border-crypto-border bg-crypto-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
                  disabled={isUploading}
                />
              </div>
              <p className="text-xs text-crypto-foreground/60">
                Upload a file containing transaction IDs (JSON array, newline separated, or comma separated)
              </p>
              
              <Button
                onClick={handleFileUpload}
                disabled={!file || isUploading}
                className="w-full mt-2 bg-crypto-primary hover:bg-crypto-primary/80"
              >
                {isUploading ? (
                  <>
                    <FileText className="mr-2 h-4 w-4 animate-pulse" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Process Transactions
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="paste" className="mt-4">
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="transaction-paste" className="text-sm font-medium">
                Transaction IDs
              </label>
              <Textarea
                id="transaction-paste"
                placeholder="Paste transaction IDs (one per line, JSON array, or comma separated)"
                value={pasteInput}
                onChange={(e) => setPasteInput(e.target.value)}
                className="min-h-32 font-mono text-sm"
                disabled={isUploading}
              />
              <p className="text-xs text-crypto-foreground/60">
                Paste transaction IDs in any format (JSON array, raw list, newline or comma separated)
              </p>
              
              <Button
                onClick={handlePasteUpload}
                disabled={!pasteInput.trim() || isUploading}
                className="w-full mt-2 bg-crypto-primary hover:bg-crypto-primary/80"
              >
                {isUploading ? (
                  <>
                    <FileJson className="mr-2 h-4 w-4 animate-pulse" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileJson className="mr-2 h-4 w-4" />
                    Process Transactions
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {isUploading && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-crypto-foreground/70">
              <span>Processed: {processedCount}/{totalCount}</span>
              <span>{progress}%</span>
            </div>
          </div>
        )}

        {processedCount > 0 && !isUploading && (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span>Successfully processed {processedCount} transactions</span>
          </div>
        )}
        
        {errorCount > 0 && !isUploading && (
          <div className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="h-4 w-4" />
            <span>{errorCount} transactions had errors</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionBatchUploader;
