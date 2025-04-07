
/**
 * Bitcoin signature utilities
 */

/**
 * Decode a DER signature from Bitcoin transaction
 * @param derHex Signature in DER format (hex string)
 * @returns Object with r and s values
 */
export const decodeDERSignature = (derHex: string): { r: string, s: string } => {
  try {
    // Validate input
    if (!derHex || typeof derHex !== 'string') {
      throw new Error('Invalid DER signature format');
    }
    
    // Remove any SIGHASH byte if present
    let hex = derHex;
    if (hex.length > 140) {
      hex = hex.slice(0, -2); // Remove last byte which is likely SIGHASH_ALL
    }
    
    console.log("Decoding DER signature:", hex);
    
    // Check if Bitcoin library is available 
    if (window?.Bitcoin?.ECDSA) {
      console.log("Using Bitcoin.ECDSA to decode signature");
      try {
        // Use the Bitcoin library to parse the signature
        const sig = window.Bitcoin.ECDSA.parseSig(hex);
        return {
          r: sig.r.toString(16).padStart(64, '0'),
          s: sig.s.toString(16).padStart(64, '0')
        };
      } catch (bitcoinError) {
        console.error("Error using Bitcoin.ECDSA:", bitcoinError);
        // Fall back to manual parsing below
      }
    }
    
    // Manual DER parsing as fallback
    console.log("Using manual DER parsing fallback");
    // DER format: 30 + len + 02 + rlen + r + 02 + slen + s
    if (!hex.startsWith('30')) {
      throw new Error('Invalid DER signature: missing header');
    }
    
    // Convert hex string to byte array for easier parsing
    const bytes = hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [];
    if (bytes.length < 8) { // Minimum valid DER signature length
      throw new Error('DER signature too short');
    }
    
    let position = 1; // Skip '30'
    const totalLen = bytes[position];
    position++;
    
    // Check for integer marker for R value
    if (bytes[position] !== 0x02) {
      throw new Error('Invalid DER signature: missing first integer marker');
    }
    position++;
    
    // Get R value length and value
    const rLen = bytes[position];
    position++;
    let rBytes = bytes.slice(position, position + rLen);
    position += rLen;
    
    // Skip any leading zeros in r
    while (rBytes.length > 0 && rBytes[0] === 0) {
      rBytes = rBytes.slice(1);
    }
    
    // Check for integer marker for S value
    if (bytes[position] !== 0x02) {
      throw new Error('Invalid DER signature: missing second integer marker');
    }
    position++;
    
    // Get S value length and value
    const sLen = bytes[position];
    position++;
    let sBytes = bytes.slice(position, position + sLen);
    
    // Skip any leading zeros in s
    while (sBytes.length > 0 && sBytes[0] === 0) {
      sBytes = sBytes.slice(1);
    }
    
    // Convert to hex strings and pad
    const r = rBytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '').padStart(64, '0');
    const s = sBytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '').padStart(64, '0');
    
    return { r, s };
  } catch (error: any) {
    console.error("Error decoding DER signature:", error);
    throw new Error(`Failed to decode DER signature: ${error.message}`);
  }
};

/**
 * Encode r and s values to DER format signature
 * @param r R value as hex string
 * @param s S value as hex string
 * @param sighashType Optional sighash type (default: 0x01 for SIGHASH_ALL)
 * @returns DER encoded signature as hex string
 */
export const encodeToDER = (r: string, s: string, sighashType: number = 0x01): string => {
  try {
    // Check if Bitcoin library is available for optimal encoding
    if (window?.Bitcoin?.ECDSA) {
      try {
        // Convert r and s to BigIntegers as required by the library
        const rBN = window.Bitcoin.BigInteger.fromHex(r);
        const sBN = window.Bitcoin.BigInteger.fromHex(s);
        
        // Create the signature with Bitcoin.ECDSA
        return window.Bitcoin.ECDSA.serializeSig(rBN, sBN, sighashType);
      } catch (bitcoinError) {
        console.error("Error using Bitcoin.ECDSA for encoding:", bitcoinError);
        // Fall back to manual encoding
      }
    }
    
    // Manual DER encoding as fallback
    console.log("Using manual DER encoding");
    
    // Remove leading zeros from hex strings for proper encoding
    const rClean = r.replace(/^0+/, '');
    const sClean = s.replace(/^0+/, '');
    
    // Convert to byte arrays
    const rBytes = rClean.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [];
    const sBytes = sClean.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [];
    
    // Check if first byte has high bit set and add padding zero if needed
    const rPadded = (parseInt(rClean.substring(0, 2), 16) & 0x80) ? [0, ...rBytes] : rBytes;
    const sPadded = (parseInt(sClean.substring(0, 2), 16) & 0x80) ? [0, ...sBytes] : sBytes;
    
    // Calculate lengths
    const rLen = rPadded.length;
    const sLen = sPadded.length;
    const sigLen = 2 + rLen + 2 + sLen; // 2 for r marker + r + 2 for s marker + s
    
    // Build DER signature
    const derBytes = [
      0x30, // Sequence
      sigLen, // Total length
      0x02, // Integer marker for r
      rLen, // Length of r
      ...rPadded, // r value
      0x02, // Integer marker for s
      sLen, // Length of s
      ...sPadded, // s value
      sighashType // Sighash type
    ];
    
    // Convert back to hex string
    return derBytes.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error: any) {
    console.error("Error encoding to DER format:", error);
    throw new Error(`Failed to encode signature to DER: ${error.message}`);
  }
};

/**
 * Verify if a signature is valid for a message hash and public key
 * @param messageHash Hash of the message as hex string
 * @param signature Signature object with r and s
 * @param publicKeyX X coordinate of public key as hex
 * @param publicKeyY Y coordinate of public key as hex
 * @returns Boolean indicating if signature is valid
 */
export const verifySignature = (
  messageHash: string, 
  signature: { r: string, s: string },
  publicKeyX: string,
  publicKeyY: string
): boolean => {
  try {
    // Use secp256k1 library if available for optimal verification
    if (window?.secp256k1) {
      try {
        // Convert message hash to bytes
        const msgHashBytes = new Uint8Array(
          messageHash.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
        );
        
        // Create compressed public key
        const isYEven = BigInt(`0x${publicKeyY}`) % 2n === 0n;
        const prefix = isYEven ? '02' : '03';
        const compressedPubKey = prefix + publicKeyX.padStart(64, '0');
        
        // Convert public key to bytes
        const pubKeyBytes = new Uint8Array(
          compressedPubKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
        );
        
        // Convert signature to DER format
        const sigDER = encodeToDER(signature.r, signature.s);
        const sigBytes = new Uint8Array(
          sigDER.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
        );
        
        // Use secp256k1 to verify
        return window.secp256k1.ecdsaVerify(sigBytes, msgHashBytes, pubKeyBytes);
      } catch (secp256k1Error) {
        console.error("Error using secp256k1 for verification:", secp256k1Error);
        // Fall back to Bitcoin.ECDSA if available
      }
    }
    
    // Use Bitcoin.ECDSA if available as a fallback
    if (window?.Bitcoin?.ECDSA) {
      try {
        // Convert message hash to BigInteger
        const msgHashBN = window.Bitcoin.BigInteger.fromHex(messageHash);
        
        // Convert r and s to BigIntegers
        const rBN = window.Bitcoin.BigInteger.fromHex(signature.r);
        const sBN = window.Bitcoin.BigInteger.fromHex(signature.s);
        
        // Create point from x,y
        const curve = window.Bitcoin.ECDSA.ecparams.curve;
        const point = curve.point(
          window.Bitcoin.BigInteger.fromHex(publicKeyX),
          window.Bitcoin.BigInteger.fromHex(publicKeyY)
        );
        
        // Verify signature
        return window.Bitcoin.ECDSA.verify(msgHashBN, rBN, sBN, point);
      } catch (bitcoinError) {
        console.error("Error using Bitcoin.ECDSA for verification:", bitcoinError);
        console.warn("Signature verification not supported without proper libraries");
        return false;
      }
    }
    
    console.warn("Neither secp256k1 nor Bitcoin.ECDSA available for signature verification");
    return false;
  } catch (error: any) {
    console.error("Error verifying signature:", error);
    return false;
  }
};
