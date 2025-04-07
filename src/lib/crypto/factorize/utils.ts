
/**
 * Utility functions for factorization
 */

import bigInt from 'big-integer';

/**
 * Convert a native BigInt to big-integer library format
 * 
 * @param n Native BigInt
 * @returns big-integer format
 */
export const convertToBigInt = (n: bigint): bigInt.BigInteger => {
  return bigInt(n.toString());
};
