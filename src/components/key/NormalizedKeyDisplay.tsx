
import React from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface NormalizedKeyDisplayProps {
  normalizedKey: string;
}

const NormalizedKeyDisplay: React.FC<NormalizedKeyDisplayProps> = ({ normalizedKey }) => {
  return (
    <div className="grid gap-2">
      <label htmlFor="normalizedKey" className="text-sm font-medium leading-none text-crypto-foreground">
        Normalized Key
      </label>
      <div className="flex items-center space-x-2">
        <input
          type="text"
          id="normalizedKey"
          className="flex w-full rounded-md border border-crypto-border bg-crypto-background px-3 py-2 text-sm placeholder:text-crypto-foreground/50 focus:outline-none focus:ring-2 focus:ring-crypto-primary focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 font-mono text-crypto-foreground"
          value={normalizedKey}
          readOnly
          disabled
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-crypto-foreground/70 hover:text-crypto-foreground"
          onClick={() => {
            navigator.clipboard.writeText(normalizedKey);
            toast.success("Normalized key copied to clipboard.");
          }}
          disabled={!normalizedKey}
        >
          <Copy className="h-4 w-4" />
          <span className="sr-only">Copy normalized key</span>
        </Button>
      </div>
    </div>
  );
};

export default NormalizedKeyDisplay;
