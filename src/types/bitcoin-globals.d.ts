
/**
 * Global declarations for Bitcoin-related libraries
 */

declare module 'bip39' {
  export function mnemonicToSeedSync(mnemonic: string, password?: string): Buffer;
  export function mnemonicToSeed(mnemonic: string, password?: string): Promise<Buffer>;
  export function mnemonicToEntropy(mnemonic: string, wordlist?: string[]): string;
  export function entropyToMnemonic(entropy: Buffer | string, wordlist?: string[]): string;
  export function generateMnemonic(strength?: number, rng?: (size: number) => Buffer, wordlist?: string[]): string;
  export function validateMnemonic(mnemonic: string, wordlist?: string[]): boolean;
  export function setDefaultWordlist(language: string): void;
  export function getDefaultWordlist(): string;
}

declare module 'bs58' {
  export function encode(buffer: Buffer | Uint8Array): string;
  export function decode(str: string): Buffer;
}

declare module 'bech32' {
  export function decode(str: string): { prefix: string; words: number[] };
  export function encode(prefix: string, words: number[]): string;
  export function fromWords(words: number[]): Buffer;
  export function toWords(bytes: Buffer | Uint8Array): number[];
}

declare module 'bitcoinjs-message' {
  export function sign(message: string, privateKey: Buffer, compressed: boolean): string;
  export function verify(message: string, address: string, signature: string): boolean;
}

declare module 'bitcoin-ops' {
  const OPS: Record<string, number>;
  export default OPS;
}

declare module 'bitcoin-address-validation' {
  export function validate(address: string, network?: string): boolean;
  export function getAddressInfo(address: string): {
    address: string;
    type: string;
    network: string;
    bech32: boolean;
  };
}

interface Window {
  // BitcoinJS library (multiple possible globals)
  Bitcoin?: any;
  bitcoin?: any;
  bitcoinjs?: any;
  BitcoinLib?: any;
  
  // Base58 encoding/decoding
  bs58?: any;
  
  // BIP39 for mnemonic phrases
  bip39?: any;
  
  // Bech32 for SegWit addresses
  bech32?: any;
  
  // Elliptic curve cryptography
  secp256k1?: any;
  nobleSecp256k1?: any;
  secp?: any;
  
  // Signing and message verification
  bitcoinMessage?: any;
  
  // Bitcoin opcodes
  bitcoinOps?: any;
  OPS?: any;
  
  // Address validation
  bitcoinAddressValidation?: any;
  validate?: any;
  
  // Tracking loaded libraries
  bitcoinLibsLoaded?: Record<string, boolean>;
}
