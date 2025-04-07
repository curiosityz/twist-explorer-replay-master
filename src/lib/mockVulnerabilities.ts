
import { VulnerabilityCase } from '@/types';

// These point to real transactions that may contain vulnerabilities to analyze
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
    name: "ECDSA Signature Analysis",
    description: "Real blockchain transactions that may contain signature vulnerabilities for exploitation testing.",
    transactions: [
      "4494271c6a1696cd4da64706fac1c3b4501438a97301b3a3cd144db01f324e8a",
      "7e83f474d7a6b3a5719897e3e1446fd5f9a024147b878a4a291eef97cb441e62",
      "1d7eb3e6385f57e24e3f3497953907a20a9d8f11182a95e0b30901d1d1975da3"
    ],
    impact: "Medium - Could reveal private key information through signature analysis",
    details: "These are real blockchain transactions that may contain cryptographic vulnerabilities. Use them to test the vulnerability scanner's capabilities with genuine blockchain data."
  }
];
