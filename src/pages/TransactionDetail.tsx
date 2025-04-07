
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
        const { data: txData, error: txError } = await supabase
          .from(Tables.blockchain_transactions)
          .select('*')
          .eq('txid', txid)
          .limit(1)
          .maybeSingle();
          
        if (txError) {
          console.error('Error fetching transaction:', txError);
        } else {
          setTransaction(txData);
          
          if (txData && txData.decoded_json) {
            try {
              const decodedTx = typeof txData.decoded_json === 'string' 
                ? JSON.parse(txData.decoded_json) 
                : txData.decoded_json;
                
              const outputSum = decodedTx.vout
                ? decodedTx.vout.reduce((sum: number, output: any) => sum + (output.value || 0), 0)
                : 0;
              setTotalInputValue(outputSum * 1.003);
            } catch (err) {
              console.error("Error parsing transaction data:", err);
              setTotalInputValue(0);
            }
          }
        }
        
        const { data: analysisData, error: analysisError } = await supabase
          .from(Tables.vulnerability_analyses)
          .select('*')
          .eq('txid', txid)
          .limit(1)
          .maybeSingle();
          
        if (analysisError) {
          console.error('Error fetching analysis:', analysisError);
        } else if (analysisData) {
          setAnalysis(analysisData);
          
          if (analysisData?.public_key) {
            try {
              const publicKey = analysisData.public_key as unknown as CryptographicPoint;
              const publicKeyHex = publicKey.x + publicKey.y;
              
              const { data: keyData, error: keyError } = await supabase
                .from(Tables.private_key_fragments)
                .select('*')
                .eq('public_key_hex', publicKeyHex)
                .limit(1)
                .maybeSingle();
                
              if (!keyError && keyData) {
                setKeyFragment(keyData);
                
                if (keyData.completed && keyData.combined_fragments) {
                  try {
                    const isValid = verifyPrivateKey(
                      keyData.combined_fragments, 
                      publicKey.x, 
                      publicKey.y
                    );
                    setKeyVerificationStatus(isValid);
                  } catch (verifyError) {
                    console.error("Key verification error:", verifyError);
                    setKeyVerificationStatus(false);
                  }
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
              <h2 className="text-xl font-semibold">Transaction Analysis</h2>
            </CardHeader>
            <CardContent>
              <TransactionTabs
                analysis={analysis}
                transaction={transaction}
                keyFragment={keyFragment}
                totalInputValue={totalInputValue}
                keyVerificationStatus={keyVerificationStatus}
              />
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
