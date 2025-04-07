
/**
 * Cryptographic utilities for twisted curve analysis and private key recovery
 * This is a consolidated file that re-exports all crypto functionality
 */

// Re-export all crypto functionality from individual modules
export { 
  hexToBigInt, 
  bigIntToHex, 
  gcd, 
  modularInverse, 
  areAllCoprime 
} from './crypto/mathUtils';

export {
  isPointOnCurve,
  isPointOnTwistCurve,
  pointAdd,
  scalarMultiply
} from './crypto/curveOperations';

export {
  chineseRemainderTheorem,
  selectCoprimeModuli,
  combinePrivateKeyFragments,
  hasEnoughFragmentsForFullRecovery
} from './crypto/crtUtils';

export {
  normalizePrivateKey,
  verifyPrivateKey
} from './crypto/keyUtils';

export { 
  curveParams, 
  twistParams 
} from './crypto/constants';
