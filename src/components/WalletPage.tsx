
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import KeyManagementPanel from '@/components/KeyManagementPanel';
import WalletInterface from '@/components/WalletInterface';
import WalletKeyImport from '@/components/WalletKeyImport';
import TransactionBatchUploader from '@/components/TransactionBatchUploader';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TransactionDetailView from './transactions/TransactionDetailView';
import { fetchTransactionDetails } from '@/services/transactionService';
import { supabase, Tables } from '@/integrations/supabase/client';
import { CryptographicPoint } from '@/types';
import { verifyPrivateKey } from '@/lib/cryptoUtils';

const WalletPage = () => {
  const [showImport, setShowImport] = useState(false);
  const [importedKey, setImportedKey] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [keyFragmentData, setKeyFragmentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalInputValue, setTotalInputValue] = useState(0);
  const [keyVerificationStatus, setKeyVerificationStatus] = useState<boolean | null>(null);
  
  const handleImportKey = (key: string) => {
    setImportedKey(key);
    setShowImport(false);
  };
  
  const handleTransactionSelected = async (txid: string) => {
    setSelectedTransaction(txid);
    setIsLoading(true);
    setAnalysisData(null);
    setKeyFragmentData(null);
    setTotalInputValue(0);
    setKeyVerificationStatus(null);
    
    try {
      // Fetch transaction details
      const txData = await fetchTransactionDetails(txid);
      setTransactionData(txData);
      
      if (txData) {
        try {
          // Calculate total input value based on output sum + fee (simplified)
          const outputs = txData.vout || [];
          const outputSum = outputs.reduce((sum: number, output: any) => sum + (output.value || 0), 0);
          setTotalInputValue(outputSum * 1.003); // Estimate with 0.3% fee
        } catch (err) {
          console.error("Error calculating input value:", err);
        }
      }
      
      // Fetch analysis data
      const { data: analysisResult, error: analysisError } = await supabase
        .from(Tables.vulnerability_analyses)
        .select('*')
        .eq('txid', txid)
        .maybeSingle();
        
      if (!analysisError && analysisResult) {
        setAnalysisData(analysisResult);
        
        // If we have a public key, check for key fragments
        if (analysisResult?.public_key) {
          try {
            // Safe access with type checking
            const publicKey = analysisResult.public_key as unknown as CryptographicPoint;
            const publicKeyHex = publicKey.x + publicKey.y;
            
            const { data: keyData, error: keyError } = await supabase
              .from(Tables.private_key_fragments)
              .select('*')
              .eq('public_key_hex', publicKeyHex)
              .maybeSingle();
              
            if (!keyError && keyData) {
              setKeyFragmentData(keyData);
              
              // Verify the private key if it exists
              if (keyData.completed && keyData.combined_fragments) {
                const isValid = verifyPrivateKey(
                  keyData.combined_fragments, 
                  publicKey.x, 
                  publicKey.y
                );
                setKeyVerificationStatus(isValid);
              }
            }
          } catch (err) {
            console.error("Error processing key data:", err);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching transaction details:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCloseTransactionView = () => {
    setSelectedTransaction(null);
    setTransactionData(null);
    setAnalysisData(null);
    setKeyFragmentData(null);
    setTotalInputValue(0);
    setKeyVerificationStatus(null);
  };
  
  return (
    <div className="min-h-screen bg-crypto-background text-crypto-foreground">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center mb-4">
            <Button variant="outline" size="sm" asChild className="mr-2">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Bitcoin Wallet</h1>
          <p className="text-crypto-foreground/70 mt-1">
            Manage and recover private keys, view balances and transactions
          </p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {selectedTransaction ? (
              <TransactionDetailView
                transaction={transactionData}
                analysis={analysisData}
                keyFragment={keyFragmentData}
                totalInputValue={totalInputValue}
                keyVerificationStatus={keyVerificationStatus}
                onClose={handleCloseTransactionView}
                isLoading={isLoading}
                txid={selectedTransaction}
              />
            ) : (
              <WalletInterface />
            )}
          </div>
          
          <div className="space-y-6">
            {showImport ? (
              <WalletKeyImport 
                onImport={handleImportKey}
                onCancel={() => setShowImport(false)}
              />
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-crypto-foreground">Wallet Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button 
                        variant="default" 
                        className="w-full"
                        onClick={() => setShowImport(true)}
                      >
                        Import Private Key
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        asChild
                      >
                        <Link to="/keys">
                          View Recovered Keys
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <TransactionBatchUploader
                  onTransactionSelected={handleTransactionSelected}
                />
                
                <KeyManagementPanel 
                  initialPrivateKey={importedKey || undefined}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
