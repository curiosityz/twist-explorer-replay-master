
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, Key, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { WalletKey, formatBtcValue } from '@/lib/walletUtils';

interface AddressesTabProps {
  walletKeys: WalletKey[];
  selectedKeyIndex: number;
  loadingKeys: boolean;
  copiedKey: string | null;
  onSelectKey: (index: number) => void;
  onCopyKey: (key: string, keyId: string) => void;
  onRefreshBalance: () => void;
  onSwitchToImport: () => void;
}

const AddressesTab: React.FC<AddressesTabProps> = ({
  walletKeys,
  selectedKeyIndex,
  loadingKeys,
  copiedKey,
  onSelectKey,
  onCopyKey,
  onRefreshBalance,
  onSwitchToImport
}) => {
  return (
    <div className="space-y-4">
      {walletKeys.length === 0 ? (
        <div className="text-center py-6 border border-dashed rounded-md">
          <Key className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            {loadingKeys 
              ? 'Loading recovered keys...' 
              : 'No private keys available yet'}
          </p>
          <div className="flex justify-center space-x-2 mt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onSwitchToImport}
            >
              <Plus className="mr-2 h-4 w-4" /> 
              Import Key
            </Button>
            <Button 
              variant="default" 
              size="sm"
              asChild
            >
              <Link to="/keys">
                <Key className="mr-2 h-4 w-4" />
                View Recovered Keys
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Available Keys</h3>
          </div>
          
          <div className="space-y-3">
            {walletKeys.map((key, index) => (
              <div 
                key={key.address}
                className={`border p-3 rounded-md cursor-pointer transition-colors ${
                  index === selectedKeyIndex 
                    ? 'bg-primary/5 border-primary/30' 
                    : 'hover:bg-muted'
                }`}
                onClick={() => onSelectKey(index)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={key.verified ? "default" : "secondary"}>
                      {key.verified ? 'Verified' : 'Imported'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{key.network}</span>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCopyKey(key.privateKey, key.address);
                          }}
                        >
                          {copiedKey === key.address ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy Private Key</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="font-mono text-sm break-all mb-2">
                  {key.address}
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="text-sm flex items-center">
                    <span>{formatBtcValue(key.balance || 0)} BTC</span>
                  </div>
                  
                  {index === selectedKeyIndex && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRefreshBalance();
                      }}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {selectedKeyIndex >= 0 && walletKeys[selectedKeyIndex] && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Private Key</h3>
              <div className="bg-muted p-3 rounded-md relative">
                <div className="font-mono text-xs break-all">
                  {walletKeys[selectedKeyIndex]?.privateKey || 'No private key available'}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={() => {
                    if (selectedKeyIndex >= 0 && walletKeys[selectedKeyIndex]?.privateKey) {
                      onCopyKey(
                        walletKeys[selectedKeyIndex]?.privateKey, 
                        'private-key'
                      );
                    }
                  }}
                >
                  {copiedKey === 'private-key' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                {walletKeys[selectedKeyIndex] && !walletKeys[selectedKeyIndex].verified && (
                  <div className="flex items-center mt-2 text-amber-500 text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    This key cannot be verified without public key information
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AddressesTab;
