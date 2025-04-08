
/**
 * Type definitions for public key objects
 */

interface PublicKey {
  x: string;
  y: string;
  isOnCurve?: boolean;
}

declare global {
  interface Window {
    PublicKey: PublicKey;
  }
}

export type { PublicKey };
