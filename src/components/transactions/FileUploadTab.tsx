
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Upload } from 'lucide-react';

interface FileUploadTabProps {
  isUploading: boolean;
  onUploadFile: (file: File) => void;
}

const FileUploadTab = ({ isUploading, onUploadFile }: FileUploadTabProps) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
  };
  
  const handleUpload = () => {
    if (file) {
      onUploadFile(file);
    }
  };
  
  return (
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
        onClick={handleUpload}
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
  );
};

export default FileUploadTab;
