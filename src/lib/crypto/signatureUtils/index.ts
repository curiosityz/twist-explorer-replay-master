
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
