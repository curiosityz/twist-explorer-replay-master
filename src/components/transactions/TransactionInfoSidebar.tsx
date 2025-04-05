
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Bitcoin, Eye, Wallet, DollarSign, Unlock } from 'lucide-react';
import { format } from 'date-fns';
import { formatBtcValue, formatUsdValue } from '@/lib/walletUtils';

interface TransactionInfoSidebarProps {
  transaction: any;
  analysis: any;
  keyFragment: any;
  totalInputValue: number;
  keyVerificationStatus: boolean | null;
}

export function TransactionInfoSidebar({ 
  transaction, 
  analysis, 
  keyFragment, 
  totalInputValue,
  keyVerificationStatus
}: TransactionInfoSidebarProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'analyzing': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Transaction Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-xs text-crypto-foreground/70">Created</div>
            <div>{transaction ? format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm') : '-'}</div>
          </div>
          
          <div className="space-y-2">
            <div className="text-xs text-crypto-foreground/70">Chain</div>
            <div>{transaction?.chain || 'Unknown'}</div>
          </div>
          
          {totalInputValue > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-crypto-foreground/70">Transaction Value</div>
              <div className="flex items-center">
                <Bitcoin className="h-4 w-4 text-amber-400 mr-1" />
                <span className="font-mono">{formatBtcValue(totalInputValue)} BTC</span>
                <span className="ml-2 text-xs text-crypto-foreground/70">
                  ({formatUsdValue(totalInputValue)})
                </span>
              </div>
            </div>
          )}
          
          {analysis && (
            <>
              <div className="space-y-2">
                <div className="text-xs text-crypto-foreground/70">Analysis Status</div>
                <Badge variant={getStatusBadgeVariant(analysis.status)}>
                  {analysis.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="text-xs text-crypto-foreground/70">Vulnerability Type</div>
                <div>{analysis.vulnerability_type}</div>
              </div>
            </>
          )}
          
          {keyFragment && keyFragment.completed && (
            <div className="space-y-2">
              <div className="text-xs text-crypto-foreground/70">Key Recovery</div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">Complete</Badge>
                {keyVerificationStatus !== null && (
                  <Badge variant={keyVerificationStatus ? "outline" : "secondary"} className={keyVerificationStatus ? "border-green-500 text-green-500" : "border-amber-500 text-amber-500"}>
                    {keyVerificationStatus ? "Verified" : "Verification Failed"}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <div className="space-y-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/">
                  <Eye className="mr-2 h-4 w-4" />
                  Analyze Another Transaction
                </Link>
              </Button>
              
              {keyFragment && keyFragment.completed && (
                <Button asChild variant="default" size="sm" className="w-full">
                  <Link to="/wallet">
                    <Wallet className="mr-2 h-4 w-4" />
                    Open Wallet
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {keyFragment && keyFragment.completed && totalInputValue > 0 && (
        <Card className="mt-6 border border-green-500/20 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center text-green-500">
              <Unlock className="h-4 w-4 mr-2" />
              Recovered Funds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-md bg-crypto-background">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">BTC Value</span>
                <div className="flex items-center">
                  <Bitcoin className="h-4 w-4 text-amber-400 mr-1" />
                  <span className="font-mono">{formatBtcValue(totalInputValue)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">USD Value</span>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                  <span className="font-mono">{formatUsdValue(totalInputValue)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
