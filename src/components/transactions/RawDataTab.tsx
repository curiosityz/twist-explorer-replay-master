
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, FileCode, FileSearch } from 'lucide-react';

interface RawDataTabProps {
  transaction: any;
  analysis: any;
}

export function RawDataTab({ transaction, analysis }: RawDataTabProps) {
  return (
    <>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Transaction Data</h3>
        
        <Collapsible className="w-full">
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-crypto-background p-4 font-medium">
            Raw Transaction JSON
            <ChevronDown className="h-4 w-4 transition-transform duration-200 collapsible-open:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 rounded-md bg-crypto-background p-4 font-mono text-xs overflow-auto max-h-[400px]">
              <pre>{transaction ? JSON.stringify(
                typeof transaction.decoded_json === 'string' 
                  ? JSON.parse(transaction.decoded_json) 
                  : transaction.decoded_json, 
                null, 2
              ) : 'No data'}</pre>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
      
      {transaction?.raw_hex && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Raw Transaction Hex</h3>
          <div className="bg-crypto-background rounded-md p-4 font-mono text-xs overflow-auto max-h-[200px]">
            {transaction.raw_hex}
          </div>
        </div>
      )}
      
      {analysis && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Raw Analysis Data</h3>
          <Collapsible className="w-full">
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-crypto-background p-4 font-medium">
              Analysis JSON
              <ChevronDown className="h-4 w-4 transition-transform duration-200 collapsible-open:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 rounded-md bg-crypto-background p-4 font-mono text-xs overflow-auto max-h-[400px]">
                <pre>{JSON.stringify(analysis, null, 2)}</pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </>
  );
}
