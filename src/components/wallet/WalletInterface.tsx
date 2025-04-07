
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet } from 'lucide-react';
import { useWalletInterface } from '@/hooks/useWalletInterface';
import AddressesTab from './tabs/AddressesTab';
import TransactionsTab from './tabs/TransactionsTab';
import ImportKeyTab from './tabs/ImportKeyTab';

const WalletInterface: React.FC = () => {
  const {
    walletKeys,
    selectedKeyIndex,
    importedKey,
    selectedNetwork,
    loadingKeys,
    recipientAddress,
    sendAmount,
    feeRate,
    utxos,
    activeTab,
    loadingUtxos,
    copiedKey,
    setImportedKey,
    setSelectedNetwork,
    setRecipientAddress,
    setSendAmount,
    setFeeRate,
    setActiveTab,
    setSelectedKeyIndex,
    importPrivateKey,
    createTransaction,
    copyToClipboard,
    handleRefreshBalance,
  } = useWalletInterface();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-6 w-6" />
          Wallet
        </CardTitle>
        <CardDescription>
          Manage recovered private keys and send transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="import">Import Key</TabsTrigger>
          </TabsList>
          
          <TabsContent value="addresses">
            <AddressesTab
              walletKeys={walletKeys}
              selectedKeyIndex={selectedKeyIndex}
              loadingKeys={loadingKeys}
              copiedKey={copiedKey}
              onSelectKey={setSelectedKeyIndex}
              onCopyKey={copyToClipboard}
              onRefreshBalance={handleRefreshBalance}
              onSwitchToImport={() => setActiveTab('import')}
            />
          </TabsContent>
          
          <TabsContent value="transactions">
            <TransactionsTab
              selectedKeyIndex={selectedKeyIndex}
              walletKeys={walletKeys}
              recipientAddress={recipientAddress}
              sendAmount={sendAmount}
              feeRate={feeRate}
              utxos={utxos}
              loadingUtxos={loadingUtxos}
              onRecipientChange={setRecipientAddress}
              onSendAmountChange={setSendAmount}
              onFeeRateChange={setFeeRate}
              onRefreshBalance={handleRefreshBalance}
              onCreateTransaction={createTransaction}
            />
          </TabsContent>
          
          <TabsContent value="import">
            <ImportKeyTab
              importedKey={importedKey}
              selectedNetwork={selectedNetwork}
              onImportedKeyChange={setImportedKey}
              onNetworkChange={setSelectedNetwork}
              onImportKey={importPrivateKey}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WalletInterface;
