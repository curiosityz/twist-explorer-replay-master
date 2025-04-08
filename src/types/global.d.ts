/**
 * Global type definitions
 */

interface Window {
  // Bitcoin libraries
  Bitcoin: any;
  bitcoin: any;
  bitcoinjs: any;
  bip39: any;
  bs58: any;
  bech32: any;
  secp256k1: any;
  nobleSecp256k1: any;
  bitcoinMessage: any;
  bitcoinAddressValidation: any;
  
  // Other global utilities
  PublicKey: import('./publicKey').PublicKey;
}
