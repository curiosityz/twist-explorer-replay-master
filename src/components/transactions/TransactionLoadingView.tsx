
import React from 'react';
import { LoadingState } from './LoadingState';

interface TransactionLoadingViewProps {
  txid?: string;
}

export const TransactionLoadingView: React.FC<TransactionLoadingViewProps> = ({ txid }) => {
  return <LoadingState txid={txid} />;
};
