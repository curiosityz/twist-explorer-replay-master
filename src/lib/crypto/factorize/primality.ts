
/**
 * Primality testing utilities
 * Based on FranX1024/factorizer
 */

import bigInt from 'big-integer';

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
