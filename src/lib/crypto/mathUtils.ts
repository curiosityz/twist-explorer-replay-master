
/**
 * Mathematical utilities for cryptographic operations
 */

/**
 * Calculate greatest common divisor of two numbers
 * @param a First number
 * @param b Second number
 * @returns GCD of a and b
 */
export const gcd = (a: bigint, b: bigint): bigint => {
  while (b !== 0n) {
    [a, b] = [b, a % b];
  }
  return a;
};

/**
 * Calculate modular inverse using Extended Euclidean Algorithm
 * @param a Number to find inverse of
 * @param m Modulus
 * @returns Modular inverse of a mod m, or null if not exists
 */
export const modularInverse = (a: bigint, m: bigint): bigint | null => {
  if (m === 1n) return 0n;
  
  let [old_r, r] = [a, m];
  let [old_s, s] = [1n, 0n];
  let [old_t, t] = [0n, 1n];
  
  while (r !== 0n) {
    const quotient = old_r / r;
    [old_r, r] = [r, old_r - quotient * r];
    [old_s, s] = [s, old_s - quotient * s];
    [old_t, t] = [t, old_t - quotient * t];
  }
  
  // GCD must be 1 for the inverse to exist
  if (old_r !== 1n) return null;
  
  return (old_s % m + m) % m;
};

/**
 * Check if all values in an array are coprime with each other
 * @param values Array of bigint values to check
 * @returns True if all values are pairwise coprime
 */
export const areAllCoprime = (values: bigint[]): boolean => {
  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) {
      if (gcd(values[i], values[j]) !== 1n) {
        return false;
      }
    }
  }
  return true;
};

/**
 * Convert hex string to BigInt
 * @param hex Hexadecimal string (with or without 0x prefix)
 * @returns BigInt representation
 */
export const hexToBigInt = (hex: string): bigint => {
  if (hex.startsWith('0x')) {
    return BigInt(hex);
  } else {
    return BigInt(`0x${hex}`);
  }
};

/**
 * Convert BigInt to hex string
 * @param num BigInt number
 * @returns Hexadecimal string with 0x prefix
 */
export const bigIntToHex = (num: bigint): string => {
  return `0x${num.toString(16)}`;
};
