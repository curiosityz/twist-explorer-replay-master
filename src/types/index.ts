
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

export enum VulnerabilityType {
  TWISTED_CURVE = 'twisted_curve',
  NONCE_REUSE = 'nonce_reuse',
  WEAK_SIGNATURE = 'weak_signature',
  UNKNOWN = 'unknown',
  NONE = 'none',
  INVALID = 'invalid'
}

export type VulnerabilityTypeString = keyof typeof VulnerabilityType | string;

export interface AnalysisResult {
  txid: string;
  vulnerabilityType: VulnerabilityType;
  publicKey: CryptographicPoint;
  signature: Signature;
  twistOrder?: string;
  primeFactors?: string[];
  privateKeyModulo?: Record<string, string>;
  status: "completed" | "analyzing" | "failed" | "pending";
  message: string;
  recoveredPrivateKey?: string | null; // Added field to store the recovered private key
}

// Expanded secp256k1 curve parameters
export interface CurveParameters {
  p: bigint; // Field prime
  n: bigint; // Curve order
  a: bigint; // Curve parameter a
  b: bigint; // Curve parameter b
  Gx: bigint; // Generator x-coordinate
  Gy: bigint; // Generator y-coordinate
  h: bigint; // Cofactor
  name: string; // Curve name
}

// Node connection related types
export interface NodeConfiguration {
  name: string;
  rpcUrl: string;
  chain: ChainType;
  apiKey?: string;
  connected: boolean;
  lastSyncBlock?: number;
  syncStatus?: 'connected' | 'syncing' | 'error';
}

export type ChainType = 'BTC' | 'BCH' | 'BSV' | 'LTC' | 'Other';

// Database types
export interface DatabaseTransaction extends Transaction {
  id: string;
  chain: string;
  raw_hex?: string;
  decoded_json?: any;
  created_at: string;
  processed: boolean;
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

// Key recovery types
export interface KeyRecoveryResult {
  privateKey: string;
  verified: boolean;
  estimatedValue: number;
  userActionRequired: boolean;
}

export interface SecurityWarning {
  level: 'info' | 'warning' | 'critical';
  message: string;
  actionRequired: boolean;
  actionDescription?: string;
}

/**
 * Vulnerability analysis data structure
 */
export interface VulnerabilityAnalysis {
  created_at: string;
  id: string;
  message: string | null;
  prime_factors: any;
  private_key_modulo: any;
  public_key: any;
  signature: any;
  status: string;
  twist_order: string | null;
  txid: string;
  updated_at: string;
  vulnerability_type: string;
  recovered_private_key?: string | null;
}
