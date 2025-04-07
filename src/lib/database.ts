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
  vulnerability_type: 'twisted_curve' | 'nonce_reuse' | 'weak_signature' | 'unknown';
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  message?: string;
  twist_order?: string;
  prime_factors?: string[];
  private_key_modulo?: Record<string, string>;
  created_at: string;
  updated_at: string;
  recovered_private_key?: string | null;
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

// Constants for known vulnerabilities
export const VULNERABILITY_TYPES = {
  TWISTED_CURVE: 'twisted_curve',
  NONCE_REUSE: 'nonce_reuse',
  WEAK_SIGNATURE: 'weak_signature',
  UNKNOWN: 'unknown'
} as const;

// Constants for analysis status
export const ANALYSIS_STATUS = {
  PENDING: 'pending',
  ANALYZING: 'analyzing',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

// Helper function to convert JSON data from database to proper types
export const normalizeVulnerabilityAnalysis = (data: any): VulnerabilityAnalysis | null => {
  if (!data) return null;
  
  // Handle private_key_modulo to ensure it's a Record<string, string>
  const privateKeyModulo: Record<string, string> = {};
  if (data.private_key_modulo && typeof data.private_key_modulo === 'object') {
    Object.entries(data.private_key_modulo).forEach(([key, value]) => {
      privateKeyModulo[key] = String(value);
    });
  }
  
  return {
    id: data.id,
    txid: data.txid,
    public_key: data.public_key,
    signature: data.signature,
    vulnerability_type: data.vulnerability_type,
    status: data.status,
    message: data.message,
    twist_order: data.twist_order,
    prime_factors: Array.isArray(data.prime_factors) ? 
      data.prime_factors.map(String) : [],
    private_key_modulo: privateKeyModulo,
    created_at: data.created_at,
    updated_at: data.updated_at,
    recovered_private_key: data.recovered_private_key
  };
};

// Helper function to convert JSON data for key fragments
export const normalizeKeyFragment = (data: any): PrivateKeyFragment | null => {
  if (!data) return null;
  
  // Handle modulo_values to ensure it's a Record<string, string>
  const moduloValues: Record<string, string> = {};
  if (data.modulo_values && typeof data.modulo_values === 'object') {
    Object.entries(data.modulo_values).forEach(([key, value]) => {
      moduloValues[key] = String(value);
    });
  }
  
  return {
    id: data.id,
    public_key_hex: data.public_key_hex,
    modulo_values: moduloValues,
    combined_fragments: data.combined_fragments,
    completed: !!data.completed,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
};

export interface Database {
  blockchain_transactions: BlockchainTransaction;
  vulnerability_analyses: VulnerabilityAnalysis;
  private_key_fragments: PrivateKeyFragment;
}
