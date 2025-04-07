
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Download, RefreshCw, Trash2, UploadCloud } from 'lucide-react';

interface KeyActionButtonsProps {
  normalizedKey: string;
  isVerifying?: boolean;
  isImporting: boolean;
  isExporting: boolean;
  isDeleting: boolean;
  onVerify: () => void;
  onImport: () => void;
  onExport: () => void;
  onDelete: () => void;
}

const KeyActionButtons: React.FC<KeyActionButtonsProps> = ({
  normalizedKey,
  isVerifying = false,
  isImporting,
  isExporting,
  isDeleting,
  onVerify,
  onImport,
  onExport,
  onDelete
}) => {
  return (
    <div className="flex justify-between">
      <div className="flex space-x-2">
        <Button
          variant="secondary"
          onClick={onVerify}
          disabled={!normalizedKey || isVerifying}
        >
          <Check className="mr-2 h-4 w-4" />
          Verify Key
        </Button>
        <Button
          variant="outline"
          onClick={onImport}
          disabled={isImporting}
        >
          {isImporting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <UploadCloud className="mr-2 h-4 w-4" />
              Import Key
            </>
          )}
        </Button>
      </div>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          onClick={onExport}
          disabled={isExporting || !normalizedKey}
        >
          {isExporting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export Key
            </>
          )}
        </Button>
        <Button
          variant="destructive"
          onClick={onDelete}
          disabled={isDeleting || !normalizedKey}
        >
          {isDeleting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Key
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default KeyActionButtons;
