
/**
 * Advanced integer factorization utilities based on FranX1024/factorizer
 * 
 * Re-exports all functionality from the factorize directory
 * This file is kept for backward compatibility
 */

// Re-export all factorization functionality
export { 
  factorize,
  factorizeBigInt,
  isPrime,
  trialDivision,
  pollardRho,
  pollardP1,
  convertToBigInt
} from './factorize';
