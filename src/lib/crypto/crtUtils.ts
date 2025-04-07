
/**
 * Chinese Remainder Theorem (CRT) implementation for private key recovery
 */

import { areAllCoprime, modularInverse, hexToBigInt, bigIntToHex, bigIntToPrivateKeyHex } from './mathUtils';
import { curveParams } from './constants';

/**
 * Chinese Remainder Theorem (CRT) to combine private key fragments
 * @param congruences Array of [remainder, modulus] pairs
 * @returns Combined value that satisfies all congruences, or null if no solution exists
 */
export const chineseRemainderTheorem = (congruences: [bigint, bigint][]): bigint | null => {
  if (congruences.length === 0) return null;
  
  // Verify all moduli are coprime
  const moduli = congruences.map(([_, m]) => m);
  if (!areAllCoprime(moduli)) {
    console.error("Moduli are not coprime, CRT requires coprime moduli");
    return null;
  }
  
  // Calculate product of all moduli (M)
  const M = moduli.reduce((acc, m) => acc * m, 1n);
  console.log("Product of all moduli (M):", M.toString());
  
  let result = 0n;
  
  // For each congruence, calculate Ni, yi, and partial result
  for (let i = 0; i < congruences.length; i++) {
    const [remainder, modulus] = congruences[i];
    
    // Calculate Ni = M / modulus
    const Ni = M / modulus;
    console.log(`N${i} = M / m${i} = ${M} / ${modulus} = ${Ni}`);
    
    // Calculate yi = inverse of Ni (mod modulus)
    const yi = modularInverse(Ni % modulus, modulus);
    if (yi === null) {
      console.error(`Failed to find modular inverse for ${Ni} mod ${modulus}`);
      return null;
    }
    console.log(`y${i} = inverse(${Ni} mod ${modulus}) = ${yi}`);
    
    // Add partial result: remainder * Ni * yi
    const partialResult = (remainder * Ni * yi) % M;
    console.log(`Partial result for ${i}: ${remainder} * ${Ni} * ${yi} = ${partialResult}`);
    
    result = (result + partialResult) % M;
  }

  console.log("Final CRT raw result:", result.toString());
  
  // For the test case verification
  if (congruences.some(([_, m]) => m === 101n)) {
    const expected = 9606208636557092712n;
    console.log(`Expected test value: ${expected}`);
    console.log(`CRT output: ${result}`);
    console.log(`Match: ${result === expected}`);
    
    // If not matching, print congruence details
    if (result !== expected) {
      console.error("CRT result doesn't match expected value!");
      congruences.forEach(([r, m], i) => {
        console.log(`Congruence ${i}: x ≡ ${r} (mod ${m})`);
      });
    }
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
    console.log("Combining fragments:", JSON.stringify(fragments, null, 2));
    
    if (Object.keys(fragments).length < 2) {
      console.log('Not enough fragments to combine');
      return null;
    }
    
    // Convert fragments to BigInt pairs
    const congruences: [bigint, bigint][] = Object.entries(fragments).map(
      ([modulus, remainder]) => {
        // Ensure proper conversion to BigInt regardless of format
        const mod = typeof modulus === 'string' ? 
          (modulus.startsWith('0x') ? BigInt(modulus) : BigInt(parseInt(modulus))) : 
          BigInt(modulus);
          
        const rem = typeof remainder === 'string' ? 
          (remainder.startsWith('0x') ? BigInt(remainder) : BigInt(parseInt(remainder))) : 
          BigInt(remainder);
          
        console.log(`Congruence: ${rem} mod ${mod}`);
        return [rem, mod];
      }
    );
    
    // Log all congruences for debugging
    congruences.forEach(([r, m], index) => {
      console.log(`Congruence ${index}: x ≡ ${r} (mod ${m})`);
    });
    
    // Test case specific log
    const hasTestCase = congruences.some(([_, m]) => m === 101n);
    if (hasTestCase) {
      console.log("TEST CASE DETECTED: Verifying against expected output 9606208636557092712");
    }
    
    // Apply CRT to all congruences
    const combinedValue = chineseRemainderTheorem(congruences);
    if (combinedValue === null) {
      console.log('No solution exists for the given congruences');
      return null;
    }
    
    console.log("CRT result raw BigInt:", combinedValue.toString());
    
    // For the test case, verify against the expected value
    const expectedTestValue = 9606208636557092712n;
    if (hasTestCase) {
      console.log("Comparing with expected test value:");
      console.log(`Expected: ${expectedTestValue}`);
      console.log(`Actual  : ${combinedValue}`);
      console.log(`Match   : ${combinedValue === expectedTestValue}`);
    }
    
    // Convert to properly formatted private key hex
    const formattedHex = bigIntToPrivateKeyHex(combinedValue);
    console.log("Formatted private key hex:", formattedHex);
    
    return `0x${formattedHex}`;
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
      // Handle different possible formats
      const bigIntMod = typeof mod === 'string' ? 
        (mod.startsWith('0x') ? BigInt(mod) : BigInt(parseInt(mod))) : 
        BigInt(mod);
      return acc * bigIntMod;
    }, 1n);
    
    // Compare with curve order
    return moduliProduct > curveParams.n;
  } catch (error) {
    console.error("Error checking fragment sufficiency:", error);
    return false;
  }
};

/**
 * Test function to verify the CRT implementation with known test case
 * @returns Verification result and details
 */
export const testCrtImplementation = () => {
  try {
    // Test case with fragments that should produce 9606208636557092712
    const testFragments = {
      "101": "45",    // 101: 45
      "103": "67",    // 103: 67
      "107": "89",    // 107: 89
      "109": "94",    // 109: 94
      "113": "51",    // 113: 51
      "127": "83",    // 127: 83
      "131": "112",   // 131: 112
      "137": "59"     // 137: 59
    };
    
    console.log("Running CRT test with fragments:", testFragments);
    
    // Call the combinePrivateKeyFragments function with the test fragments
    const result = combinePrivateKeyFragments(testFragments);
    
    // Expected value for comparison
    const expectedBigInt = 9606208636557092712n;
    const expectedHex = `0x${bigIntToPrivateKeyHex(expectedBigInt)}`;
    console.log("Expected BigInt:", expectedBigInt.toString());
    console.log("Expected hex:", expectedHex);
    
    // Compare with exact expected value
    const resultBigInt = result ? hexToBigInt(result) : 0n;
    const exactMatch = resultBigInt === expectedBigInt;
    
    return {
      rawResult: result,
      resultBigInt: resultBigInt.toString(),
      expectedBigInt: expectedBigInt.toString(),
      expectedHex: expectedHex,
      actualHex: result,
      exactMatch: exactMatch,
      passed: exactMatch
    };
  } catch (error) {
    console.error("Error in CRT test:", error);
    return { error: String(error), passed: false };
  }
};
