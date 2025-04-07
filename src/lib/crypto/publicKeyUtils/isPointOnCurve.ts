
/**
 * Utilities for checking if points are on the secp256k1 curve
 */

/**
 * Check if a point is on the secp256k1 curve
 * @param xHex X coordinate (hex string)
 * @param yHex Y coordinate (hex string)
 * @returns Boolean indicating if the point is on the curve
 */
export const isPointOnSecp256k1Curve = (xHex: string, yHex: string): boolean => {
  try {
    // Clean inputs - remove 0x prefix if present
    const xClean = xHex.startsWith('0x') ? xHex.slice(2) : xHex;
    const yClean = yHex.startsWith('0x') ? yHex.slice(2) : yHex;
    
    // Validate inputs
    if (!/^[0-9a-fA-F]+$/.test(xClean) || !/^[0-9a-fA-F]+$/.test(yClean)) {
      console.error("Invalid hex format in coordinates");
      return false;
    }
    
    // Convert hex strings to BigInt
    const x = BigInt(`0x${xClean}`);
    const y = BigInt(`0x${yClean}`);
    
    // secp256k1 curve parameters
    const p = 2n ** 256n - 2n ** 32n - 2n ** 9n - 2n ** 8n - 2n ** 7n - 2n ** 6n - 2n ** 4n - 1n; // Field prime
    const a = 0n; // Curve coefficient a
    const b = 7n; // Curve coefficient b
    
    // Check if y² ≡ x³ + ax + b (mod p)
    // For secp256k1, this simplifies to y² ≡ x³ + 7 (mod p)
    const left = (y * y) % p;
    const right = (((x * x * x) % p) + b) % p;
    
    return left === right;
  } catch (error) {
    console.error("Error checking if point is on curve:", error);
    return false;
  }
};

// For backward compatibility
export const isPointOnCurve = isPointOnSecp256k1Curve;
