
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types';

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
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const isValidTransaction = (tx: any): boolean => {
    return tx && typeof tx === 'object' && tx.txid && typeof tx.txid === 'string';
  };

  const processTransactions = async (transactions: any[]) => {
    setTotalCount(transactions.length);
    setProcessedCount(0);
    setErrorCount(0);
    
    let validTransactions = transactions.filter(isValidTransaction);
    let successCount = 0;
    
    for (let i = 0; i < validTransactions.length; i++) {
      const tx = validTransactions[i];
      
      try {
        // Store transaction in database
        const { error } = await supabase
          .from('blockchain_transactions')
          .upsert({
            txid: tx.txid,
            chain: tx.chain || 'BTC',
            raw_hex: tx.hex,
            decoded_json: tx
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
        setProgress(Math.round(((i + 1) / validTransactions.length) * 100));
      }
    }

    // Select the first valid transaction for viewing
    if (validTransactions.length > 0) {
      onTransactionSelected(validTransactions[0].txid);
    }
    
    toast({
      title: "Batch Processing Complete",
      description: `Successfully processed ${successCount} of ${transactions.length} transactions. ${transactions.length - validTransactions.length} skipped due to missing TXID.`,
      variant: successCount === 0 ? "destructive" : "default",
    });
    
    setIsUploading(false);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setProgress(0);
    setErrorCount(0);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        let transactions: any[] = [];
        
        try {
          // Try to parse as JSON
          const parsed = JSON.parse(content);
          
          // Handle different JSON formats
          if (Array.isArray(parsed)) {
            transactions = parsed;
          } else if (parsed.transactions && Array.isArray(parsed.transactions)) {
            transactions = parsed.transactions;
          } else {
            // Single transaction
            transactions = [parsed];
          }
          
          await processTransactions(transactions);
        } catch (error) {
          // If not valid JSON, try parsing as newline-delimited JSON
          try {
            const lines = content.split('\n').filter(line => line.trim());
            const parsedLines = lines.map(line => {
              try {
                return JSON.parse(line);
              } catch (e) {
                return null;
              }
            }).filter(Boolean);
            
            if (parsedLines.length > 0) {
              transactions = parsedLines;
              await processTransactions(transactions);
            } else {
              throw new Error("No valid JSON found");
            }
          } catch (error) {
            toast({
              title: "Error Processing File",
              description: "Could not parse the file format. Please ensure it's valid JSON.",
              variant: "destructive",
            });
            setIsUploading(false);
          }
        }
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

  return (
    <Card className="bg-crypto-muted border-crypto-border">
      <CardHeader>
        <CardTitle className="text-crypto-foreground">Batch Transaction Processor</CardTitle>
        <CardDescription className="text-crypto-foreground/70">
          Upload and process multiple transactions at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <label htmlFor="transaction-file" className="text-sm font-medium">
            Transaction File (JSON)
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
            Upload a JSON file containing transaction data
          </p>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full bg-crypto-primary hover:bg-crypto-primary/80"
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
