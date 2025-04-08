
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
  solveDiscreteLog
} from './crypto/discreteLogUtils';

export { 
  curveParams, 
  twistParams 
} from './crypto/constants';

export {
  factorize
} from './crypto/factorize';

// Export Bitcoin-specific utilities properly
export {
  isValidBitcoinAddress,
  validateBitcoinAddress,
  decodeDERSignature,
  decompressPublicKey,
  isPointOnSecp256k1Curve,
  wifToPrivateKey,
  createCompressedPublicKey
} from './crypto/bitcoinUtilities';

// Re-export all vulnerability analysis functionality
export {
  analyzeTransaction,
  fetchAnalysisForTransaction,
  prepareAnalysisResult,
  verifyRecoveredKey,
  saveKeyFragments,
  fetchKeyFragmentsForPublicKey
} from './vulnerability';
