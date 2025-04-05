
import { Card, CardContent } from '@/components/ui/card';
import { Bitcoin, DollarSign, Unlock, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatBtcValue, formatUsdValue } from '@/lib/walletUtils';

interface RecoveredFundsCardProps {
  totalInputValue: number;
  keyVerificationStatus: boolean | null;
}

export function RecoveredFundsCard({ totalInputValue, keyVerificationStatus }: RecoveredFundsCardProps) {
  return (
    <Card className="mb-6 border border-green-500/20 bg-green-500/5">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mr-4">
              <Unlock className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-green-500">Private Key Recovered!</h3>
              <p className="text-sm text-crypto-foreground/70">Funds potentially recoverable from this transaction</p>
              {keyVerificationStatus !== null && (
                <div className={`mt-1 text-sm flex items-center ${keyVerificationStatus ? 'text-green-500' : 'text-amber-500'}`}>
                  {keyVerificationStatus ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Key verified - matches public key
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Key verification failed
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end mb-1">
              <Bitcoin className="h-4 w-4 text-amber-400 mr-1" />
              <span className="font-mono text-lg">{formatBtcValue(totalInputValue)} BTC</span>
            </div>
            <div className="font-mono text-sm text-crypto-foreground/70">
              {formatUsdValue(totalInputValue)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
