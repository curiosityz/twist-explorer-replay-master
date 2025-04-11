
/**
 * Public Key Compression Utilities
 */

/**
 * Modular exponentiation for BigInts
 * @param base Base number as BigInt
 * @param exponent Exponent as BigInt
 * @param modulus Modulus as BigInt
 * @returns Result of (base^exponent) % modulus
 */
export function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  if (modulus === BigInt(1)) return BigInt(0);
  let result = BigInt(1);
  base = base % modulus;
  
  while (exponent > BigInt(0)) {
    if (exponent % BigInt(2) === BigInt(1)) {
      result = (result * base) % modulus;
    }
    exponent = exponent >> BigInt(1);
    base = (base * base) % modulus;
  }
  return result;
}

/**
 * Compress a public key
 * @param publicKeyX X coordinate of the public key
 * @param publicKeyY Y coordinate of the public key
 * @returns Compressed public key as a hex string
 */
export const compressPublicKey = (publicKeyX: string, publicKeyY: string): string => {
  const x = BigInt(`0x${publicKeyX}`);
  const y = BigInt(`0x${publicKeyY}`);
  const prefix = y % BigInt(2) === BigInt(0) ? '02' : '03';
  return prefix + x.toString(16).padStart(64, '0');
};

/**
 * Decompress a compressed public key
 * @param compressedKey Compressed public key as a hex string
 * @returns Object containing X and Y coordinates of the decompressed public key
 */
export const decompressPublicKey = (compressedKey: string): { x: string, y: string, isOnCurve: boolean } | null => {
  if (compressedKey.length !== 66 || (!compressedKey.startsWith('02') && !compressedKey.startsWith('03'))) {
    console.error("Invalid compressed public key format");
    return null;
  }
  
  const xHex = compressedKey.slice(2);
  const x = BigInt(`0x${xHex}`);
  
  // secp256k1 curve parameters
  const p = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F");
  const a = BigInt(0);
  const b = BigInt(7);
  
  // y^2 = x^3 + ax + b (mod p)
  let ySquared = (modPow(x, BigInt(3), p) + a * x + b) % p;
  
  // Use Tonelli-Shanks algorithm to find the modular square root
  let y = tonelliShanks(ySquared, p);
  
  if (y === null) {
    console.error("Could not find modular square root");
    return null;
  }
  
  const prefix = compressedKey.slice(0, 2);
  const isYEven = y % BigInt(2) === BigInt(0);
  
  if ((prefix === '02' && !isYEven) || (prefix === '03' && isYEven)) {
    y = (p - y) % p;
  }
  
  return {
    x: xHex,
    y: y.toString(16).padStart(64, '0'),
    isOnCurve: true
  };
};

/**
 * Tonelli-Shanks algorithm for finding modular square roots
 * @param n Number to find the square root of
 * @param p Modulus (prime number)
 * @returns Modular square root of n modulo p, or null if it doesn't exist
 */
function tonelliShanks(n: bigint, p: bigint): bigint | null {
  if (modPow(n, (p - BigInt(1)) / BigInt(2), p) !== BigInt(1)) {
    return null; // Legendre symbol is -1, so no square root exists
  }
  
  if (p % BigInt(4) === BigInt(3)) {
    return modPow(n, (p + BigInt(1)) / BigInt(4), p);
  }
  
  let Q = p - BigInt(1);
  let S = BigInt(0);
  while (Q % BigInt(2) === BigInt(0)) {
    Q = Q / BigInt(2);
    S = S + BigInt(1);
  }
  
  let z = BigInt(2);
  while (modPow(z, (p - BigInt(1)) / BigInt(2), p) !== p - BigInt(1)) {
    z = z + BigInt(1);
  }
  
  let M = S;
  let c = modPow(z, Q, p);
  let t = modPow(n, Q, p);
  let R = modPow(n, (Q + BigInt(1)) / BigInt(2), p);
  
  while (true) {
    if (t === BigInt(1)) {
      return R;
    }
    
    let i = BigInt(1);
    let tmp = t;
    
    while (tmp !== BigInt(1) && i < M) {
      tmp = modPow(tmp, BigInt(2), p);
      i = i + BigInt(1);
    }
    
    if (i === M) {
      return null; // No square root exists
    }
    
    let b = modPow(c, modPow(BigInt(2), M - i - BigInt(1), p - BigInt(1)), p);
    
    M = i;
    c = modPow(b, BigInt(2), p);
    t = (t * c) % p;
    R = (R * b) % p;
  }
}
