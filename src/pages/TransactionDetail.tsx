
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { supabase, Tables } from '@/integrations/supabase/client';
import { CryptographicPoint } from '@/types';
import { verifyPrivateKey } from '@/lib/cryptoUtils';
import { TransactionHeader } from '@/components/transactions/TransactionHeader';
import { RecoveredFundsCard } from '@/components/transactions/RecoveredFundsCard';
import { TransactionInfoSidebar } from '@/components/transactions/TransactionInfoSidebar';
import { TransactionTabs } from '@/components/transactions/TransactionTabs';
import { LoadingState } from '@/components/transactions/LoadingState';
import { NotFoundState } from '@/components/transactions/NotFoundState';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const TransactionDetail = () => {
  const { txid } = useParams();
  const [transaction, setTransaction] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [keyFragment, setKeyFragment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analysis');
  const [totalInputValue, setTotalInputValue] = useState(0);
  const [keyVerificationStatus, setKeyVerificationStatus] = useState<boolean | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!txid) return;
      
      setLoading(true);
      
      try {
        // Fetch transaction details
        const { data: txData, error: txError } = await supabase
          .from(Tables.blockchain_transactions)
          .select('*')
          .eq('txid', txid)
          .maybeSingle();
          
        if (txError) {
          console.error('Error fetching transaction:', txError);
        } else {
          setTransaction(txData);
          
          // Calculate total input value for recovered funds estimation
          if (txData && txData.decoded_json) {
            try {
              // For demo purposes, use output sum + fee estimation
              const decodedTx = typeof txData.decoded_json === 'string' 
                ? JSON.parse(txData.decoded_json) 
                : txData.decoded_json;
                
              const outputSum = decodedTx.vout
                ? decodedTx.vout.reduce((sum: number, output: any) => sum + (output.value || 0), 0)
                : 0;
              // Assume a slightly higher input value (0.3% fee)
              setTotalInputValue(outputSum * 1.003);
            } catch (err) {
              console.error("Error parsing transaction data:", err);
              setTotalInputValue(0);
            }
          }
        }
        
        // Fetch analysis details
        const { data: analysisData, error: analysisError } = await supabase
          .from(Tables.vulnerability_analyses)
          .select('*')
          .eq('txid', txid)
          .maybeSingle();
          
        if (analysisError) {
          console.error('Error fetching analysis:', analysisError);
        } else {
          setAnalysis(analysisData);
          
          // If we have a public key, check for key fragments
          if (analysisData?.public_key) {
            try {
              // Safe access with type checking
              const publicKey = analysisData.public_key as unknown as CryptographicPoint;
              const publicKeyHex = publicKey.x + publicKey.y;
              
              const { data: keyData, error: keyError } = await supabase
                .from(Tables.private_key_fragments)
                .select('*')
                .eq('public_key_hex', publicKeyHex)
                .maybeSingle();
                
              if (!keyError && keyData) {
                setKeyFragment(keyData);
                
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
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [txid]);

  if (loading) {
    return <LoadingState />;
  }
  
  if (!transaction && !analysis) {
    return <NotFoundState />;
  }

  return (
    <div className="min-h-screen bg-crypto-background text-crypto-foreground p-6">
      <TransactionHeader 
        txid={txid} 
        status={analysis?.status}
      />
      
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          {totalInputValue > 0 && keyFragment && keyFragment.completed && (
            <RecoveredFundsCard 
              totalInputValue={totalInputValue} 
              keyVerificationStatus={keyVerificationStatus}
            />
          )}
          
          <Card>
            <CardHeader className="pb-3">
              <TransactionTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                analysis={analysis}
                keyFragment={keyFragment}
                transaction={transaction}
                totalInputValue={totalInputValue}
                keyVerificationStatus={keyVerificationStatus}
              />
            </CardHeader>
            <CardContent>
              {/* The tab content is handled by TransactionTabs component */}
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-12 lg:col-span-4">
          <TransactionInfoSidebar 
            transaction={transaction}
            analysis={analysis}
            keyFragment={keyFragment}
            totalInputValue={totalInputValue}
            keyVerificationStatus={keyVerificationStatus}
          />
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;
