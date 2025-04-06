
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface UploadProgressProps {
  isUploading: boolean;
  progress: number;
  processedCount: number;
  totalCount: number;
  errorCount: number;
}

const UploadProgress = ({ 
  isUploading, 
  progress, 
  processedCount, 
  totalCount, 
  errorCount
}: UploadProgressProps) => {
  if (!isUploading && processedCount === 0 && errorCount === 0) {
    return null;
  }
  
  return (
    <div className="space-y-2">
      {isUploading && (
        <>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-crypto-foreground/70">
            <span>Processed: {processedCount}/{totalCount}</span>
            <span>{progress}%</span>
          </div>
        </>
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
    </div>
  );
};

export default UploadProgress;
