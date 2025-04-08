
/**
 * Types and constants for Bitcoin libraries functionality
 */

/**
 * Result of checking Bitcoin libraries status
 */
export interface BitcoinLibsCheckResult {
  loaded: boolean;
  missing: string[];
}

/**
 * List of required Bitcoin libraries
 */
export const REQUIRED_LIBRARIES = [
  'Bitcoin', 
  'bs58', 
  'bip39', 
  'bech32', 
  'secp256k1', 
  'bitcoinMessage', 
  'bitcoinAddressValidation'
];

/**
 * Map of library name to its potential aliases in the window object
 */
export const LIBRARY_ALIASES: Record<string, string[]> = {
  'Bitcoin': ['bitcoin', 'bitcoinjs', 'BitcoinJS'],
  'secp256k1': ['nobleSecp256k1', 'secp'],
  'bitcoinAddressValidation': ['validate'],
  'bitcoinMessage': ['bitcoinMessage', 'bitcoin.Message'],
  'bs58': ['base58'], 
  'bip39': ['BIP39'],
  'bech32': ['bech32', 'segwit']
};
