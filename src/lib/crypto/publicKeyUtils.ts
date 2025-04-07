
/**
 * Bitcoin public key utilities
 */

/**
 * Create compressed public key from x and y coordinates
 * @param x X coordinate (hex string)
 * @param y Y coordinate (hex string)
 * @returns Compressed public key as hex string
 */
export const createCompressedPublicKey = (x: string, y: string): string => {
  try {
    // Remove 0x prefix if present
    const xClean = x.startsWith('0x') ? x.slice(2) : x;
    const yClean = y.startsWith('0x') ? y.slice(2) : y;
    
    // Pad to 64 characters if needed
    const xPadded = xClean.padStart(64, '0');
    
    // Determine prefix based on y value (02 if even, 03 if odd)
    const isYEven = BigInt(`0x${yClean}`) % 2n === 0n;
    const prefix = isYEven ? '02' : '03';
    
    return prefix + xPadded;
  } catch (error: any) {
    console.error("Error creating compressed public key:", error);
    throw new Error(`Failed to create compressed public key: ${error.message}`);
  }
};

/**
 * Decompress a compressed public key to get x,y coordinates
 * @param compressedPubKeyHex Compressed public key (hex string)
 * @returns Object with x and y coordinates and isOnCurve flag
 */
export const decompressPublicKey = (
  compressedPubKeyHex: string
): { x: string; y: string; isOnCurve: boolean } => {
  try {
    if (!compressedPubKeyHex || compressedPubKeyHex.length !== 66) {
      throw new Error("Invalid compressed public key format");
    }
    
    // Check if Bitcoin libraries are loaded
    if (!window.secp256k1) {
      throw new Error("secp256k1 library not loaded");
    }
    
    const prefix = compressedPubKeyHex.slice(0, 2);
    const xHex = compressedPubKeyHex.slice(2);
    
    if (prefix !== "02" && prefix !== "03") {
      throw new Error("Invalid public key prefix. Must be 02 or 03");
    }
    
    // Convert hex to Buffer/Uint8Array (as expected by secp256k1)
    const compressedPubKey = new Uint8Array(
      compressedPubKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    // Use secp256k1 library to decompress the key
    try {
      // Fix: Call publicKeyConvert correctly without arguments other than the key
      const decompressedKey = window.secp256k1.publicKeyConvert(compressedPubKey);
      
      // Extract x and y from decompressed key (format: 04|x|y)
      const xBytes = decompressedKey.slice(1, 33);
      const yBytes = decompressedKey.slice(33, 65);
      
      // Convert to hex strings
      const x = Array.from(xBytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
        
      const y = Array.from(yBytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
        
      return {
        x,
        y,
        isOnCurve: true // If secp256k1 decompression succeeded, it's on the curve
      };
    } catch (error) {
      console.error("secp256k1 decompression error:", error);
      
      // Fallback implementation (if the library failed)
      const isYOdd = prefix === "03";
      
      // For fallback, we can only return the x coordinate and a placeholder for y
      return {
        x: xHex,
        y: "0".repeat(64), // Placeholder - proper implementation would compute y
        isOnCurve: false // We can't verify this without proper decompression
      };
    }
  } catch (error: any) {
    console.error("Error decompressing public key:", error);
    throw new Error(`Failed to decompress public key: ${error.message}`);
  }
};

/**
 * Check if a point is on the secp256k1 curve
 * @param xHex X coordinate (hex string)
 * @param yHex Y coordinate (hex string)
 * @returns Boolean indicating if the point is on the curve
 */
export const isPointOnSecp256k1Curve = (xHex: string, yHex: string): boolean => {
  try {
    // Convert hex strings to BigInt
    const x = BigInt(`0x${xHex}`);
    const y = BigInt(`0x${yHex}`);
    
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
