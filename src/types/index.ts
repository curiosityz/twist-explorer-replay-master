
// Transaction related types
export interface Transaction {
  txid: string;
  version: number;
  locktime: number;
  vin: Input[];
  vout: Output[];
  blockhash?: string;
  confirmations?: number;
  time?: number;
  blocktime?: number;
  hex?: string;
}

export interface Input {
  txid: string;
  vout: number;
  scriptSig?: {
    asm: string;
    hex: string;
  };
  txinwitness?: string[];
  sequence: number;
}

export interface Output {
  value: number;
  n: number;
  scriptPubKey: {
    asm: string;
    hex: string;
    reqSigs?: number;
    type: string;
    addresses?: string[];
    address?: string;
  };
}

// Vulnerability related types
export interface VulnerabilityCase {
  name: string;
  description: string;
  transactions: string[];
  impact: string;
  details: string;
}

export interface CryptographicPoint {
  x: string;
  y: string;
  isOnCurve: boolean;
}

export interface Signature {
  r: string;
  s: string;
  sighash: string;
}

export interface AnalysisResult {
  txid: string;
  vulnerabilityType: string;
  publicKey: CryptographicPoint;
  signature?: Signature;
  twistOrder?: string;
  primeFactors?: string[];
  privateKeyModulo?: Record<string, string>;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  message?: string;
}

// Node connection related types
export interface NodeConfiguration {
  name: string;
  rpcUrl: string;
  chain: string;
  apiKey?: string;
  connected: boolean;
}

export type ChainType = 'BTC' | 'BCH' | 'BSV' | 'LTC' | 'Other';
