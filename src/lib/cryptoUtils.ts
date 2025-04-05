
/**
 * Cryptographic utilities for twisted curve analysis and private key recovery
 */

/**
 * Chinese Remainder Theorem (CRT) to combine private key fragments
 * @param congruences Array of [remainder, modulus] pairs
 * @returns Combined value mod product of moduli, or null if no solution exists
 */
export const chineseRemainderTheorem = (congruences: [bigint, bigint][]) => {
  if (congruences.length === 0) return null;
  
  // Calculate product of all moduli
  const product = congruences.reduce((acc, [_, modulus]) => acc * modulus, 1n);
  
  let result = 0n;
  
  for (const [remainder, modulus] of congruences) {
    const partialProduct = product / modulus;
    const inverse = modularInverse(partialProduct, modulus);
    
    if (inverse === null) return null; // Moduli are not coprime
    
    result += remainder * partialProduct * inverse;
    result %= product;
  }
  
  return result;
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

/**
 * Attempt to combine private key fragments using CRT
 * @param fragments Map of moduli to remainders
 * @returns Combined private key as hex string, or null if not enough fragments or no solution
 */
export const combinePrivateKeyFragments = (fragments: Record<string, string>): string | null => {
  try {
    if (Object.keys(fragments).length < 2) {
      console.log('Not enough fragments to combine');
      return null;
    }
    
    const congruences: [bigint, bigint][] = Object.entries(fragments).map(
      ([modulus, remainder]) => [hexToBigInt(remainder), hexToBigInt(modulus)]
    );
    
    // Check if all moduli are coprime - requirement for CRT
    const moduli = congruences.map(([_, m]) => m);
    if (!areAllCoprime(moduli)) {
      console.log('Moduli are not all coprime, CRT cannot be applied');
      return null;
    }
    
    const combined = chineseRemainderTheorem(congruences);
    if (combined === null) {
      console.log('No solution exists for the given congruences');
      return null;
    }
    
    return bigIntToHex(combined);
  } catch (error) {
    console.error("Error combining private key fragments:", error);
    return null;
  }
};

/**
 * Determine if we have enough fragments to recover the full private key
 * @param fragments Map of moduli to remainders
 * @returns True if fragments are sufficient for full key recovery
 */
export const hasEnoughFragmentsForFullRecovery = (fragments: Record<string, string>): boolean => {
  // In a real implementation, this would check the product of moduli against the curve order
  // For this demo, we'll assume 6+ fragments is enough for full recovery
  return Object.keys(fragments).length >= 6;
};
