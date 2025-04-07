
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
    if (!(window.Bitcoin && window.Bitcoin.ECDSA)) {
      throw new Error("Bitcoin libraries not loaded");
    }
    
    // Use bitcoinjs parsing if available
    if (window.Bitcoin && window.Bitcoin.ECDSA) {
      console.log("Using Bitcoin.ECDSA to decode signature");
      const sig = window.Bitcoin.ECDSA.parseSig(hex);
      return {
        r: sig.r.toString(16).padStart(64, '0'),
        s: sig.s.toString(16).padStart(64, '0')
      };
    }
    
    // Manual DER parsing as fallback
    // DER format: 30 + len + 02 + rlen + r + 02 + slen + s
    if (!hex.startsWith('30')) {
      throw new Error('Invalid DER signature: missing header');
    }
    
    let position = 2; // Skip '30'
    const totalLen = parseInt(hex.slice(position, position + 2), 16);
    position += 2;
    
    if (hex.slice(position, position + 2) !== '02') {
      throw new Error('Invalid DER signature: missing first integer marker');
    }
    position += 2;
    
    const rLen = parseInt(hex.slice(position, position + 2), 16);
    position += 2;
    let r = hex.slice(position, position + rLen * 2);
    
    // Skip any leading zeros in r
    if (r.startsWith('00') && r.length > 64) {
      r = r.slice(2);
    }
    position += rLen * 2;
    
    if (hex.slice(position, position + 2) !== '02') {
      throw new Error('Invalid DER signature: missing second integer marker');
    }
    position += 2;
    
    const sLen = parseInt(hex.slice(position, position + 2), 16);
    position += 2;
    let s = hex.slice(position, position + sLen * 2);
    
    // Skip any leading zeros in s
    if (s.startsWith('00') && s.length > 64) {
      s = s.slice(2);
    }
    
    // Pad r and s to 64 characters (32 bytes)
    r = r.padStart(64, '0');
    s = s.padStart(64, '0');
    
    return { r, s };
  } catch (error: any) {
    console.error("Error decoding DER signature:", error);
    throw new Error(`Failed to decode DER signature: ${error.message}`);
  }
};
