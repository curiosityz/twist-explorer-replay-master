
/**
 * Main factorization module
 * Combines multiple factorization algorithms for optimal performance
 */

import bigInt from 'big-integer';
import { isPrime } from './primality';
import { trialDivision, pollardRho, pollardP1 } from './algorithms';
import { convertToBigInt } from './utils';

/**
 * Main factorization function that combines multiple methods
 * 
 * @param n Number to factorize as BigInt
 * @returns Array of prime factors as strings
 */
export const factorizeBigInt = (n: bigInt.BigInteger): string[] => {
  const factors: string[] = [];
  
  const factorize = (num: bigInt.BigInteger) => {
    // Check for primality first
    if (num.equals(1)) return;
    if (isPrime(num)) {
      factors.push(num.toString());
      return;
    }
    
    // Try trial division first for small factors
    let factor = trialDivision(num);
    
    // If trial division failed, try Pollard's rho
    if (factor.equals(num)) {
      factor = pollardRho(num);
    }
    
    // If Pollard's rho failed, try Pollard's p-1
    if (factor.equals(num)) {
      factor = pollardP1(num);
    }
    
    // If we found a factor, recurse on the factors
    if (!factor.equals(num)) {
      factorize(factor);
      factorize(num.divide(factor));
    } else {
      // If we couldn't factor further, treat as prime
      factors.push(num.toString());
    }
  };
  
  factorize(n);
  return factors;
};

/**
 * Main entry point for factorization using native BigInt
 * 
 * @param n Native BigInt to factorize
 * @returns Array of prime factors as strings
 */
export const factorize = (n: bigint): string[] => {
  console.log(`Factorizing ${n} using advanced methods...`);
  
  if (n <= 1n) return n === 1n ? ["1"] : [];
  
  // Convert native BigInt to big-integer format
  const bigIntN = convertToBigInt(n);
  
  // Perform factorization
  const factors = factorizeBigInt(bigIntN);
  
  // Log and return unique factors
  console.log(`Factorization complete. Factors: ${factors.join(', ')}`);
  
  return [...new Set(factors)];
};

// Re-export all factorization functionality
export { isPrime } from './primality';
export { trialDivision, pollardRho, pollardP1 } from './algorithms';
export { convertToBigInt } from './utils';
