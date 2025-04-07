
/**
 * Chinese Remainder Theorem (CRT) implementation for private key recovery
 */

import { areAllCoprime, modularInverse, hexToBigInt, bigIntToHex } from './mathUtils';
import { curveParams } from './constants';
import { normalizePrivateKey } from './keyUtils';

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
 * Compute the factors of a number that are needed for the Chinese Remainder Theorem
 * @param moduli Array of potential moduli to use for CRT
 * @param targetValue Value we're trying to reach or exceed
 * @returns Array of moduli that are coprime with each other and whose product exceeds targetValue
 */
export const selectCoprimeModuli = (moduli: bigint[], targetValue: bigint): bigint[] => {
  if (moduli.length === 0) return [];
  
  // Sort moduli in descending order for efficiency
  const sortedModuli = [...moduli].sort((a, b) => Number(b - a));
  
  const selected: bigint[] = [];
  let product = 1n;
  
  // Greedily select moduli that are coprime with all previously selected moduli
  for (const m of sortedModuli) {
    if (areAllCoprime([...selected, m])) {
      selected.push(m);
      product *= m;
      
      // Break once we have enough moduli
      if (product > targetValue) break;
    }
  }
  
  return selected;
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
    
    // Convert fragments to BigInt pairs
    const congruences: [bigint, bigint][] = Object.entries(fragments).map(
      ([modulus, remainder]) => [hexToBigInt(remainder), hexToBigInt(modulus)]
    );
    
    // Extract moduli
    const moduli = congruences.map(([_, m]) => m);
    
    // Check if all moduli are coprime - requirement for CRT
    if (!areAllCoprime(moduli)) {
      console.log('Not all moduli are coprime. Selecting a coprime subset...');
      
      // Select a subset of moduli that are coprime
      const selectedModuli = selectCoprimeModuli(moduli, curveParams.n);
      
      if (selectedModuli.length < 2) {
        console.log('Could not find enough coprime moduli');
        return null;
      }
      
      // Filter congruences to only use the selected moduli
      const filteredCongruences = congruences.filter(([_, m]) => 
        selectedModuli.includes(m)
      );
      
      // Apply CRT on the filtered congruences
      const combined = chineseRemainderTheorem(filteredCongruences);
      
      if (combined === null) {
        console.log('No solution exists for the given congruences');
        return null;
      }
      
      // Normalize the private key to standard format
      return normalizePrivateKey(bigIntToHex(combined));
    }
    
    // Apply CRT to all congruences
    const combined = chineseRemainderTheorem(congruences);
    if (combined === null) {
      console.log('No solution exists for the given congruences');
      return null;
    }
    
    // Normalize the private key to standard format
    return normalizePrivateKey(bigIntToHex(combined));
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
  // Check product of moduli against curve order
  try {
    if (Object.keys(fragments).length < 6) {
      return false;
    }
    
    // Calculate product of all moduli
    const moduliProduct = Object.keys(fragments).reduce((acc, mod) => {
      return acc * hexToBigInt(mod);
    }, 1n);
    
    // Compare with curve order
    return moduliProduct > curveParams.n;
  } catch (error) {
    console.error("Error checking fragment sufficiency:", error);
    return false;
  }
};
