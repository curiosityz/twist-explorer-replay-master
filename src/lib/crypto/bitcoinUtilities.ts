/**
 * Re-export all Bitcoin utility functions from their respective modules
 * This ensures backward compatibility with code that imports from bitcoinUtilities
 */

export { checkBitcoinLibsLoaded } from './bitcoinLibsCheck';
export { isValidBitcoinAddress, validateBitcoinAddress } from './addressUtils';
export { decodeDERSignature } from './signatureUtils';
export { 
  createCompressedPublicKey,
  decompressPublicKey,
  isPointOnSecp256k1Curve,
  isPointOnCurve
} from './publicKeyUtils';
export { wifToPrivateKey } from './privateKeyUtils';
