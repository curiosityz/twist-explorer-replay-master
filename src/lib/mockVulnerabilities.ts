
import { VulnerabilityCase } from '@/types';

// These are example cases for the UI to help discover real vulnerabilities
// They point to real transactions that may contain vulnerabilities to analyze
export const MOCK_VULNERABILITY_CASES: VulnerabilityCase[] = [
  {
    name: "Twisted Curve Vulnerability",
    description: "This vulnerability affects Bitcoin transactions where public keys lie on a twisted curve rather than the standard secp256k1 curve, allowing for potential private key extraction.",
    transactions: [
      "9ec4bc49e828d924af1d1029cacf709431abbde46d59554b62bc270e3b29c4b1",
      "8d31992805518fd62daa3bdd2a5c4fd2cd3054c9b3dca1d78055e9528cff6adc",
      "f15624a1ab6d8f8c37c478cf7f5c4c2910354ffac7b322a5fb97dca582e11844"
    ],
    impact: "High - Could lead to unauthorized spending of funds from vulnerable addresses",
    details: "The vulnerability occurs when a wallet implementation doesn't properly validate that a public key point lies on the secp256k1 curve. When a signature is verified against a point on a different curve (the twist), it can leak information about the private key."
  },
  {
    name: "Cross-Chain Replay Vulnerability",
    description: "Transactions intended for one blockchain can be replayed on another chain, potentially leading to unintended fund movement across chains.",
    transactions: [
      "4494271c6a1696cd4da64706fac1c3b4501438a97301b3a3cd144db01f324e8a",
      "7ac1c3b4501696cd4da647064494271c6a38a97301b3a3cd144db01f324e8a44",
      "a38a97301b3a3cd144db01f324e8a447ac1c3b4501696cd4da647064494271c6"
    ],
    impact: "Medium - Could result in duplicate transactions across multiple chains",
    details: "This vulnerability typically affects chains that share a common codebase or signing scheme but have different network identifiers. Without proper replay protection, transactions from one chain can be submitted to another chain."
  }
];
