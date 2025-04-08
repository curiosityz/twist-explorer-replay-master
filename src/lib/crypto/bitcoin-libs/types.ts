
/**
 * Type definitions for Bitcoin libraries
 */

/**
 * Result of checking for Bitcoin libraries
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
 * Mapping of library names to their possible alternative global names
 */
export const LIBRARY_ALIASES: Record<string, string[]> = {
  'Bitcoin': ['bitcoin', 'bitcoinjs', 'BitcoinLib'],
  'secp256k1': ['nobleSecp256k1', 'secp'],
  'bitcoinOps': ['OPS'],
  'bitcoinAddressValidation': ['validate']
};
