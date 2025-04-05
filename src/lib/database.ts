
// Type definitions for our database

export interface BlockchainTransaction {
  id: string;
  txid: string;
  chain: string;
  raw_hex?: string;
  decoded_json?: any;
  processed: boolean;
  created_at: string;
}

export interface VulnerabilityAnalysis {
  id: string;
  txid: string;
  public_key: {
    x: string;
    y: string;
    isOnCurve: boolean;
  };
  signature?: {
    r: string;
    s: string;
    sighash: string;
  };
  vulnerability_type: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  message?: string;
  twist_order?: string;
  prime_factors?: string[];
  private_key_modulo?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface PrivateKeyFragment {
  id: string;
  public_key_hex: string;
  modulo_values: Record<string, string>;
  combined_fragments?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Database {
  blockchain_transactions: BlockchainTransaction;
  vulnerability_analyses: VulnerabilityAnalysis;
  private_key_fragments: PrivateKeyFragment;
}
