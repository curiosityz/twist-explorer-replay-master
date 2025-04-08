
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
        return Buffer.from(data).toString('base64');
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
      mnemonicToSeedSync: (mnemonic: string): Buffer => {
        return Buffer.from(new Uint8Array(64).fill(1));
      }
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
      }
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
      publicKeyConvert: (publicKey: Uint8Array): Uint8Array => {
        // Convert to uncompressed format (65 bytes: prefix + x + y coordinates)
        const result = new Uint8Array(65);
        result[0] = 0x04; // Uncompressed format prefix
        
        // Copy the x-coordinate if available
        if (publicKey.length >= 33) {
          result.set(publicKey.slice(1, 33), 1);
        }
        
        return result;
      },
      ecdsaSign: () => {
        return {
          signature: new Uint8Array(64),
          recid: 0
        };
      },
      ecdsaVerify: () => true,
      publicKeyVerify: () => true
    };
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
        parseSig: () => ({
          r: BigInt(1),
          s: BigInt(1)
        }),
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
  }
  
  console.info("Mock libraries initialized");
};
