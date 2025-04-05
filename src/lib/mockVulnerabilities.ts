
import { VulnerabilityCase } from '@/types';

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

export const SAMPLE_TRANSACTION = {
  txid: "9ec4bc49e828d924af1d1029cacf709431abbde46d59554b62bc270e3b29c4b1",
  version: 1,
  locktime: 0,
  vin: [
    {
      txid: "5e8b3cc53f5cdf2fcb0cde5f3d4c44246db51b5f9e5c8c6125273c8d7f5da97f",
      vout: 0,
      scriptSig: {
        asm: "3045022100d13ef3f37ab36be8f7d6c96915b92e7a792cba264d9062cad5694651c91b54670220288151e60abde7701a20c445478ba3a8b3580def3737ce3d5780e35a3b0a99e1[ALL] 046c4c014b96b8731d41942428054a3b636f2a78af1e7e5ee27c88457ccce114b7ad9abed5e479dee9c5b24074e02d38e2c5a42fd9ce1d6ac47622c2f01a03975",
        hex: "483045022100d13ef3f37ab36be8f7d6c96915b92e7a792cba264d9062cad5694651c91b54670220288151e60abde7701a20c445478ba3a8b3580def3737ce3d5780e35a3b0a99e1014104046c4c014b96b8731d41942428054a3b636f2a78af1e7e5ee27c88457ccce114b7ad9abed5e479dee9c5b24074e02d38e2c5a42fd9ce1d6ac47622c2f01a03975"
      },
      sequence: 4294967295
    }
  ],
  vout: [
    {
      value: 0.05,
      n: 0,
      scriptPubKey: {
        asm: "OP_DUP OP_HASH160 8fd139bb39ced713f231c58a4d07bf6954d1c201 OP_EQUALVERIFY OP_CHECKSIG",
        hex: "76a9148fd139bb39ced713f231c58a4d07bf6954d1c20188ac",
        reqSigs: 1,
        type: "pubkeyhash",
        addresses: [
          "1E9wCJVKicZ3y2RRGt6qm5pWNMZ1Uw2J3c"
        ]
      }
    }
  ],
  blockhash: "00000000000000000012180b10a7c123ab6c48f8681da3cc5973859fde0bfe27",
  confirmations: 418741,
  time: 1415240575,
  blocktime: 1415240575
};

export const MOCK_ANALYSIS_RESULT = {
  txid: "9ec4bc49e828d924af1d1029cacf709431abbde46d59554b62bc270e3b29c4b1",
  vulnerabilityType: "Twisted Curve",
  publicKey: {
    x: "046c4c014b96b8731d41942428054a3b636f2a78af1e7e5ee27c88457ccce114",
    y: "b7ad9abed5e479dee9c5b24074e02d38e2c5a42fd9ce1d6ac47622c2f01a03975",
    isOnCurve: false
  },
  signature: {
    r: "d13ef3f37ab36be8f7d6c96915b92e7a792cba264d9062cad5694651c91b5467",
    s: "288151e60abde7701a20c445478ba3a8b3580def3737ce3d5780e35a3b0a99e1",
    sighash: "19d5e366474353ebadf0b90b5aaefd589580a56f7358407e0236a62c8f8dc343"
  },
  twistOrder: "115792089237316195423570985008687907852582819045683543245205945414558375203495",
  primeFactors: ["11", "107", "197", "251", "263", "347", "787", "1051", "1433", "2039"],
  privateKeyModulo: {
    "11": "3",
    "107": "89",
    "197": "152",
    "251": "78"
  },
  status: "completed",
  message: "Analysis complete. Private key partially recovered modulo several prime factors."
};
