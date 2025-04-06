
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileCode, Key, Shield } from 'lucide-react';
import { AnalysisTab } from './AnalysisTab';
import { KeyFragmentsTab } from './KeyFragmentsTab';
import { RawDataTab } from './RawDataTab';

interface TransactionTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  analysis: any;
  keyFragment: any;
  transaction: any;
  totalInputValue: number;
  keyVerificationStatus: boolean | null;
}

export function TransactionTabs({
  activeTab,
  setActiveTab,
  analysis,
  keyFragment,
  transaction,
  totalInputValue,
  keyVerificationStatus
}: TransactionTabsProps) {
  const fragmentCount = keyFragment?.modulo_values ? Object.keys(keyFragment.modulo_values).length : 0;
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-3 mb-2">
        <TabsTrigger value="analysis" className="data-[state=active]:bg-crypto-primary/20">
          <Shield className="h-4 w-4 mr-2" />
          Analysis
        </TabsTrigger>
        <TabsTrigger value="fragments" className="data-[state=active]:bg-crypto-primary/20">
          <Key className="h-4 w-4 mr-2" />
          Key Fragments {fragmentCount > 0 && <span className="ml-1 text-xs bg-amber-500/20 text-amber-500 px-1 rounded">{fragmentCount}</span>}
        </TabsTrigger>
        <TabsTrigger value="raw" className="data-[state=active]:bg-crypto-primary/20">
          <FileCode className="h-4 w-4 mr-2" />
          Raw Data
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="analysis" className="space-y-4">
        <AnalysisTab 
          analysis={analysis} 
          keyFragment={keyFragment} 
          totalInputValue={totalInputValue}
          keyVerificationStatus={keyVerificationStatus}
        />
      </TabsContent>
      
      <TabsContent value="fragments" className="space-y-4">
        <KeyFragmentsTab 
          keyFragment={keyFragment}
          totalInputValue={totalInputValue}
          keyVerificationStatus={keyVerificationStatus}
        />
      </TabsContent>
      
      <TabsContent value="raw" className="space-y-4">
        <RawDataTab transaction={transaction} analysis={analysis} />
      </TabsContent>
    </Tabs>
  );
}
