
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileJson } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface PasteUploadTabProps {
  isUploading: boolean;
  onUploadPasted: (text: string) => void;
}

const PasteUploadTab = ({ isUploading, onUploadPasted }: PasteUploadTabProps) => {
  const [pasteInput, setPasteInput] = useState('');
  
  const handleUpload = () => {
    if (pasteInput.trim()) {
      onUploadPasted(pasteInput);
    }
  };
  
  return (
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
        onClick={handleUpload}
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
  );
};

export default PasteUploadTab;
