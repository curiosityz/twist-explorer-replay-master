
/**
 * Mock implementations for Bitcoin libraries
 * These are used as fallbacks when the real libraries fail to load
 */

import { REQUIRED_LIBRARIES } from './types';

/**
 * Initialize mock implementations of Bitcoin libraries
 * This is used as a last resort when the real libraries fail to load
 */
export const initializeMockLibraries = (): void => {
  console.warn("Initializing mock Bitcoin libraries for fallback support");
  
  // Only create mocks for libraries that don't exist
  if (!window.bs58) {
    console.info("Creating mock bs58 library");
    (window as any).bs58 = {
      encode: (data: Uint8Array): string => {
        // Basic encode to base58 format (simplified)
        const base64 = Buffer.from(data).toString('base64');
        return base64.replace(/[+/]/g, '').replace(/=/g, '');
      },
      decode: (str: string): Uint8Array => {
        // Return empty array as fallback
        console.warn("Using mock bs58.decode - not secure!");
        return new Uint8Array(32);
      }
    };
  }
  
  if (!window.bip39) {
    console.info("Creating mock bip39 library");
    (window as any).bip39 = {
      generateMnemonic: (): string => {
        return "mock mnemonic words for testing only";
      },
      mnemonicToSeedSync: (mnemonic: string): Uint8Array => {
        return new Uint8Array(64).fill(1);
      },
      validateMnemonic: (): boolean => true
    };
  }
  
  if (!window.bech32) {
    console.info("Creating mock bech32 library");
    (window as any).bech32 = {
      decode: (str: string): { prefix: string, words: number[] } => {
        return { prefix: "bc", words: [] };
      },
      encode: (prefix: string, words: number[]): string => {
        return "bc1qmockaddress";
      },
      toWords: (bytes: Uint8Array): number[] => [],
      fromWords: (words: number[]): Uint8Array => new Uint8Array()
    };
  }
  
  if (!window.bitcoinMessage) {
    console.info("Creating mock bitcoinMessage library");
    (window as any).bitcoinMessage = {
      sign: (message: string, privateKey: string): string => {
        return "mock_signature";
      },
      verify: (message: string, address: string, signature: string): boolean => {
        return true;
      }
    };
  }
  
  if (!window.bitcoinAddressValidation) {
    console.info("Creating mock bitcoinAddressValidation library");
    (window as any).bitcoinAddressValidation = (address: string): boolean => {
      return true;
    };
    (window as any).validate = (window as any).bitcoinAddressValidation;
  }
  
  if (!window.secp256k1) {
    console.info("Creating mock secp256k1 library");
    (window as any).secp256k1 = {
      publicKeyCreate: (privateKey: Uint8Array): Uint8Array => {
        // Return compressed public key format (33 bytes: prefix + x-coordinate)
        const result = new Uint8Array(33);
        result[0] = 0x02; // Even y-coordinate prefix
        return result;
      },
      publicKeyConvert: (publicKey: Uint8Array, compressed = true): Uint8Array => {
        // If input is compressed (33 bytes) and we want uncompressed
        if (publicKey.length === 33 && !compressed) {
          // Convert to uncompressed format (65 bytes: prefix + x + y coordinates)
          const result = new Uint8Array(65);
          result[0] = 0x04; // Uncompressed format prefix
          
          // Copy the x-coordinate if available
          if (publicKey.length >= 33) {
            result.set(publicKey.slice(1, 33), 1);
          }
          
          // Generate a fake y-coordinate based on x
          // In real implementation, this would be calculated using the curve equation
          for (let i = 0; i < 32; i++) {
            result[33 + i] = (publicKey[1 + (31 - i)] + i) % 256;
          }
          
          return result;
        } 
        // If input is uncompressed (65 bytes) and we want compressed
        else if (publicKey.length === 65 && compressed) {
          // Generate compressed key (33 bytes: prefix + x-coordinate)
          const result = new Uint8Array(33);
          
          // Use even prefix (02) for simplicity
          result[0] = 0x02;
          
          // Copy x-coordinate
          result.set(publicKey.slice(1, 33), 1);
          
          return result;
        }
        
        // If already in desired format, return a copy
        return new Uint8Array(publicKey);
      },
      // Add decompress as an alias for publicKeyConvert for implementations that use this name
      decompress: function(publicKey: Uint8Array): Uint8Array {
        return this.publicKeyConvert(publicKey, false);
      },
      ecdsaSign: () => {
        return {
          signature: new Uint8Array(64),
          recid: 0
        };
      },
      ecdsaVerify: () => true,
      publicKeyVerify: () => true,
      utils: {
        // Add pointDecompress for noble-secp256k1 compatibility
        pointDecompress: function(p: Uint8Array): Uint8Array {
          // This should convert a compressed point to uncompressed
          return (window as any).secp256k1.publicKeyConvert(p, false);
        }
      }
    };
    
    // Add aliases
    (window as any).nobleSecp256k1 = (window as any).secp256k1;
    (window as any).secp = (window as any).secp256k1;
  }
  
  if (!window.Bitcoin) {
    console.info("Creating mock Bitcoin library");
    (window as any).Bitcoin = {
      crypto: {
        sha256: (buffer: Uint8Array): Uint8Array => {
          console.warn("Using mock SHA256 - not secure!");
          return new Uint8Array(32).fill(1);
        },
        ripemd160: (buffer: Uint8Array): Uint8Array => {
          console.warn("Using mock RIPEMD160 - not secure!");
          return new Uint8Array(20).fill(1);
        }
      },
      ECPair: {
        fromPrivateKey: () => ({
          publicKey: new Uint8Array(33),
          toWIF: () => "mock_wif_key"
        }),
        fromWIF: () => ({
          publicKey: new Uint8Array(33),
          privateKey: new Uint8Array(32)
        })
      },
      payments: {
        p2pkh: () => ({
          address: "mock_p2pkh_address"
        }),
        p2wpkh: () => ({
          address: "bc1qmockaddress" 
        })
      },
      Script: {
        fromHex: (hex: string) => ({
          chunks: []
        })
      },
      ECDSA: {
        parseSig: (hex: string) => {
          // Extract r and s values from DER format if possible
          let r = BigInt(1);
          let s = BigInt(1);
          
          // Simple DER signature parsing
          try {
            if (hex.length > 8) {
              // Try to get actual r and s values from the signature
              const rLength = parseInt(hex.substring(6, 8), 16);
              const rEnd = 8 + rLength * 2;
              const rHex = hex.substring(8, rEnd);
              
              const sMarkerPos = rEnd + 2;
              const sLengthPos = sMarkerPos + 2;
              const sLength = parseInt(hex.substring(sLengthPos, sLengthPos + 2), 16);
              const sStart = sLengthPos + 2;
              const sEnd = sStart + sLength * 2;
              const sHex = hex.substring(sStart, sEnd);
              
              // Parse hex values to bigint
              if (rHex && sHex) {
                r = BigInt(`0x${rHex}`);
                s = BigInt(`0x${sHex}`);
              }
            }
          } catch (e) {
            console.warn("Mock DER parsing failed, using defaults", e);
          }
          
          return {
            r,
            s
          };
        },
        parseSigCompact: () => ({
          r: BigInt(1),
          s: BigInt(1),
          i: 0
        }),
        serializeSig: () => "30450221000000000000000000000000000000000000000000000000000000000000000001022100000000000000000000000000000000000000000000000000000000000000000101",
        verify: () => true,
        ecparams: {
          curve: {
            point: () => ({})
          }
        }
      },
      BigInteger: {
        fromHex: () => BigInt(1)
      }
    };
    
    // Add aliases
    (window as any).bitcoin = (window as any).Bitcoin;
    (window as any).bitcoinjs = (window as any).Bitcoin;
  }
  
  console.info("Mock libraries initialized");
};
