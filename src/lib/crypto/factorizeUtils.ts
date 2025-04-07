
/**
 * Advanced integer factorization utilities based on FranX1024/factorizer
 * 
 * Implements various factorization algorithms:
 * - Trial division
 * - Pollard's rho algorithm
 * - Pollard's p-1 algorithm
 * - Primality testing
 */

import bigInt from 'big-integer';

// ===== Prime number testing ===== 

/**
 * Miller-Rabin primality test
 * 
 * @param n Number to test for primality
 * @param iterations Number of iterations for probabilistic testing
 * @returns true if n is probably prime, false if definitely composite
 */
export const isPrime = (n: bigInt.BigInteger, iterations: number = 10): boolean => {
  if (n.equals(2) || n.equals(3)) return true;
  if (n.isEven() || n.lesser(2)) return false;
  
  // Write n-1 as d * 2^r
  let d = n.minus(1);
  let r = 0;
  while (d.isEven()) {
    d = d.divide(2);
    r++;
  }
  
  // Witness loop
  for (let i = 0; i < iterations; i++) {
    // Random a in the range [2, n-2]
    const a = bigInt.randBetween(2, n.minus(2));
    let x = a.modPow(d, n);
    
    if (x.equals(1) || x.equals(n.minus(1))) continue;
    
    let continueLoop = false;
    for (let j = 0; j < r - 1; j++) {
      x = x.modPow(2, n);
      if (x.equals(n.minus(1))) {
        continueLoop = true;
        break;
      }
    }
    
    if (continueLoop) continue;
    return false;
  }
  
  return true;
};

// ===== Factorization algorithms ===== 

/**
 * Trial division to find small factors quickly
 * 
 * @param n Number to factorize
 * @returns A factor of n, or n itself if n is prime
 */
export const trialDivision = (n: bigInt.BigInteger): bigInt.BigInteger => {
  if (n.isEven()) return bigInt(2);
  
  // Check small primes first
  const smallPrimes = [3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
  for (const p of smallPrimes) {
    const prime = bigInt(p);
    if (n.mod(prime).equals(0)) return prime;
    if (prime.square().greater(n)) return n; // n is prime
  }
  
  // Try larger odd numbers up to sqrt(n)
  let i = bigInt(49);
  while (i.square().lesserOrEquals(n)) {
    if (n.mod(i).equals(0)) return i;
    i = i.plus(2);
  }
  
  return n;
};

/**
 * Pollard's rho algorithm for factorization
 * 
 * @param n Number to factorize
 * @param iterations Maximum iterations
 * @returns A factor of n, or n itself if no factor found
 */
export const pollardRho = (n: bigInt.BigInteger, iterations: number = 100000): bigInt.BigInteger => {
  if (n.isEven()) return bigInt(2);
  if (n.mod(3).equals(0)) return bigInt(3);
  
  const f = (x: bigInt.BigInteger): bigInt.BigInteger => x.multiply(x).plus(1).mod(n);
  
  let x = bigInt(2);
  let y = bigInt(2);
  let d = bigInt(1);
  
  for (let i = 0; i < iterations && d.equals(1); i++) {
    x = f(x);
    y = f(f(y));
    d = bigInt.gcd(x.minus(y).abs(), n);
  }
  
  if (d.equals(n)) return n; // Failed to find a factor
  return d;
};

/**
 * Pollard's p-1 algorithm for factorization
 * 
 * @param n Number to factorize
 * @param bound Smoothness bound
 * @returns A factor of n, or n itself if no factor found
 */
export const pollardP1 = (n: bigInt.BigInteger, bound: number = 10000): bigInt.BigInteger => {
  if (n.isEven()) return bigInt(2);
  
  let a = bigInt(2);
  
  for (let j = 2; j <= bound; j++) {
    a = a.modPow(bigInt(j), n);
    const d = bigInt.gcd(a.minus(1), n);
    
    if (d.greater(1) && d.lesser(n)) {
      return d;
    }
  }
  
  return n; // Failed to find a factor
};

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
 * Convert a native BigInt to big-integer library format
 * 
 * @param n Native BigInt
 * @returns big-integer format
 */
export const convertToBigInt = (n: bigint): bigInt.BigInteger => {
  return bigInt(n.toString());
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
