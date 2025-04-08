/**
 * Constants for elliptic curve cryptography operations
 */

// Secp256k1 curve parameters (Bitcoin)
export const curveParams = {
  p: BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F'), // Field prime
  n: BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141'), // Curve order
  a: 0n, // Curve parameter a
  b: 7n,  // Curve parameter b
  Gx: BigInt('0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798'), // Generator x
  Gy: BigInt('0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8')  // Generator y
};

// Twist parameters for secp256k1 (for twisted curve vulnerability analysis)
export const twistParams = {
  // p' = p for the same finite field
  p: curveParams.p,
  // a' = a for secp256k1 which is 0
  a: curveParams.a,
  // b' = u²·b (mod p) where u is a quadratic non-residue modulo p
  // For secp256k1, we can use -7 as the twist's b parameter
  b: (curveParams.p - curveParams.b) % curveParams.p,
  // Order of the twist curve group (precomputed for efficiency)
  n: BigInt('0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A1'),
  // Generator points for the twist curve (derived from the main curve generator)
  // These are simplified representations for demonstration purposes
  Gx: BigInt('0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798'),
  Gy: BigInt('0xB7C52588D95C3B9AA25B0403F1EEF75702E84BB7597AABE663B82F6F04EF2777')
};
