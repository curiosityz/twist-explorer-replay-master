
/**
 * Utility functions for compressing and decompressing public keys
 */

/**
 * Convert a compressed public key to an uncompressed public key
 * @param compressedKey The compressed public key as a hex string
 * @returns The uncompressed public key as a hex string
 */
export const decompressPublicKey = (compressedKey: string): { x: string, y: string, isOnCurve: boolean } => {
  try {
    // Clean input
    let cleanKey = compressedKey;
    if (cleanKey.startsWith('0x')) {
      cleanKey = cleanKey.slice(2);
    }
    
    // Validate format
    if (!cleanKey.startsWith('02') && !cleanKey.startsWith('03')) {
      throw new Error('Invalid compressed key format. Must start with 02 or 03.');
    }
    
    if (cleanKey.length !== 66) { // 33 bytes (1 byte prefix + 32 bytes x coordinate) = 66 hex chars
      throw new Error(`Invalid compressed key length. Expected 66 hex characters, got ${cleanKey.length}.`);
    }
    
    // Try using available secp256k1 methods
    if (window.secp256k1) {
      console.log("Attempting to use secp256k1 library for key decompression");
      
      const compressedBytes = hexToBytes(cleanKey);
      let uncompressedBytes: Uint8Array | null = null;
      let success = false;
      
      // Try different methods that might be available in various secp256k1 implementations
      try {
        if (typeof window.secp256k1.publicKeyConvert === 'function') {
          console.log("Using secp256k1.publicKeyConvert method");
          uncompressedBytes = window.secp256k1.publicKeyConvert(compressedBytes, false);
          success = true;
        } else if (typeof window.secp256k1.decompress === 'function') {
          console.log("Using secp256k1.decompress method");
          uncompressedBytes = window.secp256k1.decompress(compressedBytes);
          success = true;
        } else if (window.secp256k1.utils && typeof window.secp256k1.utils.pointDecompress === 'function') {
          console.log("Using secp256k1.utils.pointDecompress method");
          uncompressedBytes = window.secp256k1.utils.pointDecompress(compressedBytes);
          success = true;
        } else if (window.secp256k1.Point && typeof window.secp256k1.Point.fromHex === 'function') {
          console.log("Using secp256k1.Point.fromHex method");
          // For noble-secp256k1 style API
          const point = window.secp256k1.Point.fromHex(compressedBytes);
          if (point && point.x && point.y) {
            // Create uncompressed format: 0x04 | x | y
            uncompressedBytes = new Uint8Array(65);
            uncompressedBytes[0] = 0x04;
            
            // Convert coordinates to bytes
            const xBytes = hexToBytes(point.x.toString(16).padStart(64, '0'));
            const yBytes = hexToBytes(point.y.toString(16).padStart(64, '0'));
            
            uncompressedBytes.set(xBytes, 1);
            uncompressedBytes.set(yBytes, 33);
            success = true;
          }
        } else if (window.secp256k1.recoverPublicKey) {
          // Try to use alternative API if available
          console.log("Attempting with secp256k1.recoverPublicKey");
          // Create a mock signature to get back the uncompressed key
          const mockMsg = new Uint8Array(32).fill(1);
          const mockSig = new Uint8Array(64).fill(1);
          const recoveryParam = cleanKey.startsWith('02') ? 0 : 1;
          
          try {
            const pubKey = window.secp256k1.recoverPublicKey(mockMsg, mockSig, recoveryParam, false);
            if (pubKey && pubKey.length === 65) {
              uncompressedBytes = pubKey;
              success = true;
            }
          } catch(e) {
            console.log("Recovery method failed:", e);
          }
        }
        
        if (success && uncompressedBytes && uncompressedBytes.length === 65) {
          // Uncompressed format: [0x04, x(32 bytes), y(32 bytes)]
          const x = bytesToHex(uncompressedBytes.slice(1, 33));
          const y = bytesToHex(uncompressedBytes.slice(33));
          
          return {
            x: `0x${x}`,
            y: `0x${y}`,
            isOnCurve: true
          };
        } else {
          console.log("Failed to decompress using secp256k1 library, falling back to mathematical approach");
        }
      } catch (error) {
        console.warn("secp256k1 decompression attempt failed:", error);
        // Fall through to alternative method
      }
    }
    
    // If secp256k1 library is not available or failed, use mathematical implementation
    console.warn('secp256k1 library not available for key decompression. Using mathematical implementation.');
    
    // Extract prefix and x coordinate
    const prefix = cleanKey.substring(0, 2);
    const xCoord = cleanKey.substring(2);
    
    // Convert x coordinate to bigint for calculations
    const x = BigInt(`0x${xCoord}`);
    
    // secp256k1 curve parameters
    const p = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F');
    const a = BigInt(0); // secp256k1 has a=0
    const b = BigInt(7);  // secp256k1 has b=7
    
    // Calculate y² = x³ + ax + b (in this case: y² = x³ + 7)
    const xCubed = (x * x * x) % p;
    const right = (xCubed + b) % p;
    
    // Calculate square root modulo p to get y
    // This is a simplified approach - for actual implementation we'd need a proper modular square root algorithm
    let y;
    
    // For secp256k1, p ≡ 3 (mod 4), so we can use y = right^((p+1)/4) mod p
    const exp = (p + BigInt(1)) / BigInt(4);
    let yCandidate = modPow(right, exp, p);
    
    // Determine which of the two possible y values we need based on the prefix
    const isYEven = yCandidate % BigInt(2) === BigInt(0);
    if ((prefix === '02' && !isYEven) || (prefix === '03' && isYEven)) {
      // We need the other y value
      yCandidate = p - yCandidate;
    }
    
    y = yCandidate;
    
    // Verify the point is actually on the curve: y² = x³ + 7
    const ySquared = (y * y) % p;
    const isOnCurve = ySquared === right;
    
    return {
      x: `0x${xCoord}`,
      y: `0x${y.toString(16).padStart(64, '0')}`,
      isOnCurve
    };
  } catch (error: any) {
    console.error('Error decompressing public key:', error);
    throw new Error(`Failed to decompress public key: ${error.message}`);
  }
};

/**
 * Convert an uncompressed public key to a compressed public key
 * @param publicKey The uncompressed public key as a hex string or {x, y} object
 * @returns The compressed public key as a hex string
 */
export const createCompressedPublicKey = (publicKey: string | { x: string, y: string }): string => {
  try {
    let x: string, y: string;
    
    if (typeof publicKey === 'string') {
      // Parse uncompressed key format
      const cleanKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey;
      
      if (cleanKey.startsWith('04') && cleanKey.length === 130) {
        // Standard format: 04 + x(32 bytes) + y(32 bytes)
        x = cleanKey.substring(2, 66);
        y = cleanKey.substring(66);
      } else {
        throw new Error('Invalid uncompressed key format');
      }
    } else {
      // Already in {x, y} format
      x = publicKey.x.startsWith('0x') ? publicKey.x.slice(2) : publicKey.x;
      y = publicKey.y.startsWith('0x') ? publicKey.y.slice(2) : publicKey.y;
    }
    
    // Determine prefix based on y coordinate's parity
    const yValue = BigInt(`0x${y}`);
    const prefix = yValue % BigInt(2) === BigInt(0) ? '02' : '03';
    
    // Combine prefix with x coordinate
    return `${prefix}${x}`;
  } catch (error: any) {
    console.error('Error compressing public key:', error);
    throw new Error(`Failed to compress public key: ${error.message}`);
  }
};

/**
 * Convert hex string to byte array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.ceil(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Convert byte array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Modular exponentiation function (a^b mod n)
 * Implements the square-and-multiply algorithm
 */
function modPow(a: bigint, b: bigint, n: bigint): bigint {
  a = a % n;
  let result = BigInt(1);
  let x = a;
  
  // Examine each bit of the exponent b
  while (b > BigInt(0)) {
    // If the rightmost bit of b is 1, multiply result by x
    if (b % BigInt(2) === BigInt(1)) {
      result = (result * x) % n;
    }
    
    // Square x and reduce modulo n
    x = (x * x) % n;
    
    // Shift b one bit to the right
    b = b / BigInt(2);
  }
  
  return result;
}
