
import React from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface BitcoinAddressDisplayProps {
  address: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}

const BitcoinAddressDisplay: React.FC<BitcoinAddressDisplayProps> = ({ 
  address, 
  isRefreshing, 
  onRefresh 
}) => {
  return (
    <div className="grid gap-2">
      <label htmlFor="address" className="text-sm font-medium leading-none text-crypto-foreground">
        Bitcoin Address
      </label>
      <div className="flex items-center space-x-2">
        <input
          type="text"
          id="address"
          className="flex w-full rounded-md border border-crypto-border bg-crypto-background px-3 py-2 text-sm placeholder:text-crypto-foreground/50 focus:outline-none focus:ring-2 focus:ring-crypto-primary focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 font-mono text-crypto-foreground"
          value={address}
          readOnly
          disabled
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-8 w-8 p-0 text-crypto-foreground/70 hover:text-crypto-foreground"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="sr-only">Refresh address</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-crypto-foreground/70 hover:text-crypto-foreground"
          onClick={() => {
            navigator.clipboard.writeText(address);
            toast.success("Bitcoin address copied to clipboard.");
          }}
          disabled={!address}
        >
          <Copy className="h-4 w-4" />
          <span className="sr-only">Copy address</span>
        </Button>
      </div>
    </div>
  );
};

export default BitcoinAddressDisplay;
