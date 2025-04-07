
import React from 'react';
import { WalletKey } from '@/lib/walletUtils';
import { formatBtcValue, formatUsdValue } from '@/lib/walletUtils';

interface WalletSummaryProps {
  walletData: WalletKey | null;
}

const WalletSummary: React.FC<WalletSummaryProps> = ({ walletData }) => {
  if (!walletData) return null;

  return (
    <div className="space-y-2 border-t border-crypto-border pt-4">
      <div className="text-sm font-medium text-crypto-foreground">Wallet Summary</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-xs text-crypto-foreground/70">Balance</div>
          <div className="font-mono">{formatBtcValue(walletData.balance || 0)} BTC</div>
          <div className="text-xs text-crypto-foreground/70">Est. Value</div>
          <div className="font-mono">{formatUsdValue(walletData.balance || 0)}</div>
        </div>
        <div>
          <div className="text-xs text-crypto-foreground/70">Network</div>
          <div>{walletData.network}</div>
          <div className="text-xs text-crypto-foreground/70">Address</div>
          <div className="font-mono text-xs break-all">{walletData.address}</div>
        </div>
      </div>
    </div>
  );
};

export default WalletSummary;
