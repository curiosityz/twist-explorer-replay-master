
/**
 * Type definitions for Bitcoin libraries
 */

/**
 * Describes the result of checking Bitcoin libraries
 */
export interface BitcoinLibsCheckResult {
  loaded: boolean;
  missing: string[];
}

/**
 * Required libraries mapping
 */
export const REQUIRED_LIBRARIES = [
  'Bitcoin',
  'bs58',
  'bip39',
  'bech32',
  'secp256k1',
  'bitcoinMessage',
  'bitcoinAddressValidation'
] as const;

/**
 * Type for required library names
 */
export type RequiredLibraryName = typeof REQUIRED_LIBRARIES[number];

/**
 * Maps library names to their alternative global names
 */
export interface LibraryAliasMap {
  [key: string]: string[];
}

/**
 * Library aliases configuration
 */
export const LIBRARY_ALIASES: LibraryAliasMap = {
  'Bitcoin': ['bitcoin', 'bitcoinjs', 'BitcoinLib'],
  'secp256k1': ['nobleSecp256k1', 'secp'],
  'bitcoinAddressValidation': ['validate'],
  'bitcoinOps': ['OPS']
};
