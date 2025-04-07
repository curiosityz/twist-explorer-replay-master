
/**
 * Global declarations for Bitcoin-related libraries
 */

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
