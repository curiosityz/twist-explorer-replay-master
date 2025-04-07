
/**
 * Elliptic curve operations for secp256k1
 */

import { curveParams, twistParams } from './constants';
import { modularInverse, hexToBigInt } from './mathUtils';

/**
 * Check if a point is on the secp256k1 curve
 * @param x X coordinate (hex or bigint)
 * @param y Y coordinate (hex or bigint)
 * @returns Boolean indicating if point is on curve
 */
export const isPointOnCurve = (x: string | bigint, y: string | bigint): boolean => {
  const xBigInt = typeof x === 'string' ? hexToBigInt(x) : x;
  const yBigInt = typeof y === 'string' ? hexToBigInt(y) : y;
  
  // Ensure x and y are within the field range
  if (xBigInt < 0n || xBigInt >= curveParams.p || yBigInt < 0n || yBigInt >= curveParams.p) {
    return false;
  }
  
  // Check if point satisfies curve equation: y² = x³ + 7 (mod p)
  const leftSide = (yBigInt * yBigInt) % curveParams.p;
  const rightSide = (((xBigInt * xBigInt) % curveParams.p) * xBigInt + curveParams.b) % curveParams.p;
  
  return leftSide === rightSide;
};

/**
 * Check if a point is on the twist of the secp256k1 curve
 * @param x X coordinate (hex or bigint)
 * @param y Y coordinate (hex or bigint) 
 * @returns Boolean indicating if point is on twist curve
 */
export const isPointOnTwistCurve = (x: string | bigint, y: string | bigint): boolean => {
  const xBigInt = typeof x === 'string' ? hexToBigInt(x) : x;
  const yBigInt = typeof y === 'string' ? hexToBigInt(y) : y;
  
  // Ensure x and y are within the field range
  if (xBigInt < 0n || xBigInt >= twistParams.p || yBigInt < 0n || yBigInt >= twistParams.p) {
    return false;
  }
  
  // Check if point satisfies twist curve equation: y² = x³ + twist_b (mod p)
  const leftSide = (yBigInt * yBigInt) % twistParams.p;
  const rightSide = (((xBigInt * xBigInt) % twistParams.p) * xBigInt + twistParams.b) % twistParams.p;
  
  return leftSide === rightSide;
};

/**
 * Simplified point addition on secp256k1 curve
 * @param p1 First point [x, y]
 * @param p2 Second point [x, y]
 * @returns Resulting point [x, y] or null for point at infinity
 */
export const pointAdd = (
  p1: [bigint, bigint], 
  p2: [bigint, bigint]
): [bigint, bigint] | null => {
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  
  // Handle point at infinity cases
  if (x1 === 0n && y1 === 0n) return [x2, y2];
  if (x2 === 0n && y2 === 0n) return [x1, y1];
  
  // Point doubling
  if (x1 === x2 && y1 === y2) {
    // If y is 0, return point at infinity
    if (y1 === 0n) return null;
    
    // λ = (3x₁² + a) / 2y₁ mod p for point doubling
    const numerator = (3n * x1 * x1 + curveParams.a) % curveParams.p;
    const denominator = (2n * y1) % curveParams.p;
    const denomInverse = modularInverse(denominator, curveParams.p);
    
    if (denomInverse === null) return null;
    
    const lambda = (numerator * denomInverse) % curveParams.p;
    
    // Calculate x3 = λ² - 2x₁ mod p
    const x3 = (lambda * lambda - 2n * x1) % curveParams.p;
    // Calculate y3 = λ(x₁ - x3) - y₁ mod p
    const y3 = (lambda * (x1 - x3) - y1) % curveParams.p;
    
    return [(x3 + curveParams.p) % curveParams.p, (y3 + curveParams.p) % curveParams.p];
  }
  
  // Different points
  if (x1 === x2 && y1 !== y2) {
    // Return point at infinity (vertical line)
    return null;
  }
  
  // λ = (y₂ - y₁) / (x₂ - x₁) mod p for different points
  const numerator = (y2 - y1) % curveParams.p;
  const denominator = (x2 - x1) % curveParams.p;
  const denomInverse = modularInverse(denominator, curveParams.p);
  
  if (denomInverse === null) return null;
  
  const lambda = (numerator * denomInverse) % curveParams.p;
  
  // Calculate x3 = λ² - x₁ - x₂ mod p
  const x3 = (lambda * lambda - x1 - x2) % curveParams.p;
  // Calculate y3 = λ(x₁ - x3) - y₁ mod p
  const y3 = (lambda * (x1 - x3) - y1) % curveParams.p;
  
  return [(x3 + curveParams.p) % curveParams.p, (y3 + curveParams.p) % curveParams.p];
};

/**
 * Scalar multiplication (kG) on secp256k1 curve using double-and-add algorithm
 * This is the core cryptographic operation for generating public keys from private keys
 * @param k Scalar value (private key)
 * @param point Base point [x, y], defaults to generator point G
 * @returns Resulting point [x, y] (public key)
 */
export const scalarMultiply = (
  k: bigint, 
  point: [bigint, bigint] = [curveParams.Gx, curveParams.Gy]
): [bigint, bigint] | null => {
  if (k === 0n) return null;
  if (k === 1n) return point;
  
  let result: [bigint, bigint] | null = null;
  let addend: [bigint, bigint] | null = point;
  let n = k;
  
  while (n > 0n) {
    if (n & 1n) {
      // Add current bit's contribution
      if (result === null) {
        result = addend;
      } else if (addend !== null) {
        result = pointAdd(result, addend);
      }
    }
    
    // Double the addend for next bit
    if (addend !== null) {
      addend = pointAdd(addend, addend);
    }
    
    // Shift to next bit
    n >>= 1n;
  }
  
  return result;
};
