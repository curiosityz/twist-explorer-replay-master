
import { useState } from 'react';
import { WalletKey, UTXO, btcToSatoshis, satoshisToBtc, validateAddress, formatBtcValue } from '@/lib/walletUtils';
import { toast } from 'sonner';

export const useTransactionCreation = (
  walletKeys: WalletKey[],
  selectedKeyIndex: number,
  utxos: UTXO[],
  setSelectedUTXOs: (updater: UTXO[]) => void
) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [feeRate, setFeeRate] = useState(20); // Medium fee in sat/vB
  
  const createTransaction = async () => {
    if (selectedKeyIndex < 0 || !walletKeys[selectedKeyIndex]) {
      toast.error('No wallet key selected');
      return;
    }
    
    if (!validateAddress(recipientAddress)) {
      toast.error('Invalid recipient address');
      return;
    }
    
    if (isNaN(parseFloat(sendAmount)) || parseFloat(sendAmount) <= 0) {
      toast.error('Invalid amount');
      return;
    }
    
    const amountSatoshis = btcToSatoshis(parseFloat(sendAmount));
    const selectedKey = walletKeys[selectedKeyIndex];
    const availableUtxos = utxos;
    
    if (!availableUtxos.length) {
      toast.error('No UTXOs available to spend');
      return;
    }
    
    const totalInputSatoshis = availableUtxos.reduce((sum, utxo) => sum + utxo.value, 0);
    
    const estimatedSize = 150 + availableUtxos.length * 150;
    const estimatedFee = estimatedSize * feeRate;
    
    if (totalInputSatoshis < amountSatoshis + estimatedFee) {
      toast.error('Insufficient funds (including fees)');
      return;
    }
    
    const changeSatoshis = totalInputSatoshis - amountSatoshis - estimatedFee;
    
    try {
      const inputs = availableUtxos.map(utxo => ({
        txid: utxo.txid,
        vout: utxo.vout
      }));
      
      const outputs = [
        {
          address: recipientAddress,
          value: amountSatoshis
        }
      ];
      
      if (changeSatoshis > 546) {
        outputs.push({
          address: selectedKey.address,
          value: changeSatoshis
        });
      }
      
      toast.success('Transaction created successfully (demo)');
      
      const txDetails = {
        from: selectedKey.address,
        to: recipientAddress,
        amount: formatBtcValue(parseFloat(sendAmount)),
        fee: formatBtcValue(satoshisToBtc(estimatedFee)),
        total: formatBtcValue(satoshisToBtc(amountSatoshis + estimatedFee))
      };
      
      console.log('Transaction details:', txDetails);
      
      setRecipientAddress('');
      setSendAmount('');
      setSelectedUTXOs([]);
    } catch (err) {
      console.error('Error creating transaction:', err);
      toast.error('Failed to create transaction');
    }
  };

  return {
    recipientAddress,
    sendAmount,
    feeRate,
    setRecipientAddress,
    setSendAmount,
    setFeeRate,
    createTransaction
  };
};
