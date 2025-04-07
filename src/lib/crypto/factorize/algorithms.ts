
/**
 * Factorization algorithms implementation
 * Based on FranX1024/factorizer
 */

import bigInt from 'big-integer';
import { isPrime } from './primality';

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
