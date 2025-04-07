
import React from 'react';
import { NotFoundState } from './NotFoundState';

interface TransactionNotFoundViewProps {
  txid?: string;
}

export const TransactionNotFoundView: React.FC<TransactionNotFoundViewProps> = ({ txid }) => {
  return <NotFoundState txid={txid} />;
};
