```json
{
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://w3id.org/security/suites/ed25519-2020/v1',
    'https://vc-analyzer.example.com/contexts/trusted-list/v1'
  ],
  id: 'urn:uuid:2fdb8ca3-17ac-4a28-ac65-4a29fb66923a',
  type: [ 'VerifiableCredential', 'TrustedListCredential' ],
  issuer: 'did:key:z6Mkiq1TQyWPezBTGoqNvcq9b6azWMyn6HwQmbjo5LLpai68',
  issuanceDate: '2025-05-04T09:10:57.703Z',
  credentialSubject: {
    id: 'did:key:KKKKK',
    type: 'TrustedList2025',
    validFrom: '2025-05-04T09:10:57.703Z',
    trustedIssuerEntry: { validUntil: 2028-05-04T09:10:57.703Z }
  }
}
```

```json
{
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://w3id.org/security/suites/ed25519-2020/v1',
    'https://vc-analyzer.example.com/contexts/trusted-list/v1'
  ],
  id: 'urn:uuid:2fdb8ca3-17ac-4a28-ac65-4a29fb66923a',
  type: [ 'VerifiableCredential', 'TrustedListCredential' ],
  issuer: 'did:key:z6Mkiq1TQyWPezBTGoqNvcq9b6azWMyn6HwQmbjo5LLpai68',
  issuanceDate: '2025-05-04T09:10:57.703Z',
  credentialSubject: {
    id: 'did:key:KKKKK',
    type: 'TrustedList2025',
    validFrom: '2025-05-04T09:10:57.703Z',
    trustedIssuerEntry: { validUntil: '2028-05-04T09:10:57.703Z' }
  }
}
```

```json
{
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://w3id.org/security/suites/ed25519-2020/v1',
    'https://vc-analyzer.example.com/contexts/trusted-list/v1'
  ],
  type: 'Ed25519Signature2020',
  created: '2025-05-04T09:10:57Z',
  verificationMethod: 'did:key:z6Mkiq1TQyWPezBTGoqNvcq9b6azWMyn6HwQmbjo5LLpai68#z6Mkiq1TQyWPezBTGoqNvcq9b6azWMyn6HwQmbjo5LLpai68',
  proofPurpose: 'assertionMethod',
  proofValue: 'z2UoMrc24QPwNDK1aKuxbRzgZJBUjJsaVkzmmzZxZqaANPyUVER9g1YX3QVrL5c531yCxZpvQpzuYj9sUKMMBypLx'
}
```

```
Uint8Array(64) [
   32, 160, 245,  33, 192,  16,  73, 220,  90, 129, 143,
  109, 237, 214,  13, 122, 134, 153,  71,  39,  52, 111,
  166, 203,  96, 107,  36,  20, 148, 133,  60,  97, 200,
   36,  99,  66,  12, 255, 228, 155, 245,  66, 241,  27,
  141, 214,  34, 116, 226, 145, 206, 204,  52,  87, 214,
  117,   9, 215, 236,  38,  48, 197, 152, 122
]
```
Uint8Array(64) [
Uint8Array(64) [
   32, 160, 245,  33, 192,  16,  73, 220,  90, 129, 143,
  109, 237, 214,  13, 122, 134, 153,  71,  39,  52, 111,
  166, 203,  96, 107,  36,  20, 148, 133,  60,  97,  91,
   79, 222, 251, 186, 176, 114, 150, 242, 164, 199, 195,
   40,  85,  38, 125,   9, 100, 238, 255,  58,  67, 234,
  213, 172, 108,   3,  91,  36,   6,  66, 206
]]
```

```
{
  document: {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
      'https://vc-analyzer.example.com/contexts/trusted-list/v1'
    ],
    id: 'urn:uuid:38e6166a-4eae-47fc-bbfe-cc55df891c5c',
    type: [ 'VerifiableCredential', 'TrustedListCredential' ],
    issuer: 'did:key:z6Mkiq1TQyWPezBTGoqNvcq9b6azWMyn6HwQmbjo5LLpai68',
    issuanceDate: '2025-05-04T11:22:41.219Z',
    credentialSubject: {
      id: 'did:key:KKKKK',
      type: 'TrustedList2025',
      validFrom: '2025-05-04T11:22:41.219Z',
      trustedIssuerEntry: [Object]
    }
  },
  hash: Promise { <pending> }
}
```

```json
{
  document: {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
      'https://vc-analyzer.example.com/contexts/trusted-list/v1'
    ],
    id: 'urn:uuid:38e6166a-4eae-47fc-bbfe-cc55df891c5c',
    type: [ 'VerifiableCredential', 'TrustedListCredential' ],
    issuer: 'did:key:z6Mkiq1TQyWPezBTGoqNvcq9b6azWMyn6HwQmbjo5LLpai68',
    issuanceDate: '2025-05-04T11:22:41.219Z',
    credentialSubject: {
      id: 'did:key:KKKKK',
      type: 'TrustedList2025',
      validFrom: '2025-05-04T11:22:41.219Z',
      trustedIssuerEntry: [Object]
    }
  },
  hash: Promise { <pending> }
}
```

jsonld-signatures

```
Uint8Array(32) [
   43, 209,  41,   3, 158,   3, 163, 109,
  183, 159,  59, 146,  94, 175, 252,  29,
  248, 191, 199, 154, 121, 229,  89, 204,
  164, 168,  71, 220, 145,  24, 136, 166
]
Uint8Array(32) [
  173, 254,  67, 179, 151,  23, 212,
   75, 177,  73, 148, 149,  41, 187,
   61, 132, 145, 232, 162, 255, 241,
  160, 103, 238,  46,  54, 241, 117,
   45, 206, 130,  62
]
```

Uint8Array(32) [
   43, 209,  41,   3, 158,   3, 163, 109,
  183, 159,  59, 146,  94, 175, 252,  29,
  248, 191, 199, 154, 121, 229,  89, 204,
  164, 168,  71, 220, 145,  24, 136, 166
]
Uint8Array(32) [
  152,  97, 169, 195, 140, 223, 195,
  134, 204,  92,  41,   4, 156,  38,
   46,  97, 249, 197, 231, 104, 220,
  117, 198,  41, 190, 241, 193, 180,
  165, 134, 202, 149
]

```
canonizeProof= {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://w3id.org/security/suites/ed25519-2020/v1',
    'https://vc-analyzer.example.com/contexts/trusted-list/v1'
  ],
  type: 'Ed25519Signature2020',
  created: '2025-05-04T11:40:46Z',
  verificationMethod: 'did:key:z6Mkiq1TQyWPezBTGoqNvcq9b6azWMyn6HwQmbjo5LLpai68#z6Mkiq1TQyWPezBTGoqNvcq9b6azWMyn6HwQmbjo5LLpai68',
  proofPurpose: 'assertionMethod'
}
```
```
canonizeProof= {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://w3id.org/security/suites/ed25519-2020/v1',
    'https://vc-analyzer.example.com/contexts/trusted-list/v1'
  ],
  type: 'Ed25519Signature2020',
  created: '2025-05-04T11:40:46Z',
  verificationMethod: 'did:key:z6Mkiq1TQyWPezBTGoqNvcq9b6azWMyn6HwQmbjo5LLpai68#z6Mkiq1TQyWPezBTGoqNvcq9b6azWMyn6HwQmbjo5LLpai68',
  proofPurpose: 'assertionMethod',
  proofValue: 'z1mEYb8gQrp9ekX6xB5BGUB64ka46dCR45ifS3g7eKAVJ4weBidu7RNxjvEjg939EBQvA91jh8LyH75gR9nm74DG'
}
```


```
=========== Uint8Array(32) [
  243, 137,  54, 117,  10, 141, 186, 164,
   45, 226, 217, 254,  23,  65, 101, 148,
   36,  44,  52, 121, 154,  16,  61,  62,
  169, 132, 182,  40, 168, 181,  17,   9
```

=========== Uint8Array(32) [
   73,  11, 211, 153,  72,  94, 150, 114,
   65, 188, 229, 154, 188, 209,  62, 164,
   52,  18, 206,  94, 141, 128, 228,   0,
  224, 115,   0,  53, 105,  37,  59,  47
]

```json
[
  {
    subject: { termType: 'BlankNode', value: '_:b0' },
    predicate: {
      termType: 'NamedNode',
      value: 'https://vc-analyzer.example.com/contexts/trusted-list/v1#validUntil'
    },
    object: {
      termType: 'Literal',
      value: 'Thu May 04 2028 21:22:39 GMT+0900 (日本標準時)',
      datatype: [Object]
    },
    graph: { termType: 'DefaultGraph', value: '' }
  },
  {
    subject: { termType: 'NamedNode', value: 'did:key:KKKKK' },
    predicate: {
      termType: 'NamedNode',
      value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
    },
    object: {
      termType: 'NamedNode',
      value: 'https://vc-analyzer.example.com/contexts/trusted-list/v1#TrustedList2025'
    },
    graph: { termType: 'DefaultGraph', value: '' }
  },
  {
    subject: { termType: 'NamedNode', value: 'did:key:KKKKK' },
    predicate: {
      termType: 'NamedNode',
      value: 'https://vc-analyzer.example.com/contexts/trusted-list/v1#trustedIssuerEntry'
    },
    object: { termType: 'BlankNode', value: '_:b0' },
    graph: { termType: 'DefaultGraph', value: '' }
  },
  {
    subject: { termType: 'NamedNode', value: 'did:key:KKKKK' },
    predicate: {
      termType: 'NamedNode',
      value: 'https://vc-analyzer.example.com/contexts/trusted-list/v1#validFrom'
    },
    object: {
      termType: 'Literal',
      value: '2025-05-04T12:22:39.753Z',
      datatype: [Object]
    },
    graph: { termType: 'DefaultGraph', value: '' }
  },
  {
    subject: {
      termType: 'NamedNode',
      value: 'urn:uuid:75f00b1f-ee04-487e-8fc7-91873fa4174a'
    },
    predicate: {
      termType: 'NamedNode',
      value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
    },
    object: {
      termType: 'NamedNode',
      value: 'https://www.w3.org/2018/credentials#VerifiableCredential'
    },
    graph: { termType: 'DefaultGraph', value: '' }
  },
  {
    subject: {
      termType: 'NamedNode',
      value: 'urn:uuid:75f00b1f-ee04-487e-8fc7-91873fa4174a'
    },
    predicate: {
      termType: 'NamedNode',
      value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
    },
    object: {
      termType: 'NamedNode',
      value: 'https://vc-analyzer.example.com/contexts/trusted-list/v1#TrustedListCredential'
    },
    graph: { termType: 'DefaultGraph', value: '' }
  },
  {
    subject: {
      termType: 'NamedNode',
      value: 'urn:uuid:75f00b1f-ee04-487e-8fc7-91873fa4174a'
    },
    predicate: {
      termType: 'NamedNode',
      value: 'https://www.w3.org/2018/credentials#credentialSubject'
    },
    object: { termType: 'NamedNode', value: 'did:key:KKKKK' },
    graph: { termType: 'DefaultGraph', value: '' }
  },
  {
    subject: {
      termType: 'NamedNode',
      value: 'urn:uuid:75f00b1f-ee04-487e-8fc7-91873fa4174a'
    },
    predicate: {
      termType: 'NamedNode',
      value: 'https://www.w3.org/2018/credentials#issuanceDate'
    },
    object: {
      termType: 'Literal',
      value: '2025-05-04T12:22:39.753Z',
      datatype: [Object]
    },
    graph: { termType: 'DefaultGraph', value: '' }
  },
  {
    subject: {
      termType: 'NamedNode',
      value: 'urn:uuid:75f00b1f-ee04-487e-8fc7-91873fa4174a'
    },
    predicate: {
      termType: 'NamedNode',
      value: 'https://www.w3.org/2018/credentials#issuer'
    },
    object: {
      termType: 'NamedNode',
      value: 'did:key:z6Mkiq1TQyWPezBTGoqNvcq9b6azWMyn6HwQmbjo5LLpai68'
    },
    graph: { termType: 'DefaultGraph', value: '' }
  }
]
```
```json
[
  {
    subject: { termType: 'BlankNode', value: '_:b0' },
    predicate: {
      termType: 'NamedNode',
      value: 'https://vc-analyzer.example.com/contexts/trusted-list/v1#validUntil'
    },
    object: {
      termType: 'Literal',
      value: '2028-05-04T12:22:39.753Z',
      datatype: [Object]
    },
    graph: { termType: 'DefaultGraph', value: '' }
  },
  {
    subject: { termType: 'NamedNode', value: 'did:key:KKKKK' },
    predicate: {
      termType: 'NamedNode',
      value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
    },
    object: {
      termType: 'NamedNode',
      value: 'https://vc-analyzer.example.com/contexts/trusted-list/v1#TrustedList2025'
    },
    graph: { termType: 'DefaultGraph', value: '' }
  },
  {
    subject: { termType: 'NamedNode', value: 'did:key:KKKKK' },
    predicate: {
      termType: 'NamedNode',
      value: 'https://vc-analyzer.example.com/contexts/trusted-list/v1#trustedIssuerEntry'
    },
    object: { termType: 'BlankNode', value: '_:b0' },
    graph: { termType: 'DefaultGraph', value: '' }
  },
  {
    subject: { termType: 'NamedNode', value: 'did:key:KKKKK' },
    predicate: {
      termType: 'NamedNode',
      value: 'https://vc-analyzer.example.com/contexts/trusted-list/v1#validFrom'
    },
    object: {
      termType: 'Literal',
      value: '2025-05-04T12:22:39.753Z',
      datatype: [Object]
    },
    graph: { termType: 'DefaultGraph', value: '' }
  },
  {
    subject: {
      termType: 'NamedNode',
      value: 'urn:uuid:75f00b1f-ee04-487e-8fc7-91873fa4174a'
    },
    predicate: {
      termType: 'NamedNode',
      value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
    },
    object: {
      termType: 'NamedNode',
      value: 'https://www.w3.org/2018/credentials#VerifiableCredential'
    },
    graph: { termType: 'DefaultGraph', value: '' }
  },
  {
    subject: {
      termType: 'NamedNode',
      value: 'urn:uuid:75f00b1f-ee04-487e-8fc7-91873fa4174a'
    },
    predicate: {
      termType: 'NamedNode',
      value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
    },
    object: {
      termType: 'NamedNode',
      value: 'https://vc-analyzer.example.com/contexts/trusted-list/v1#TrustedListCredential'
    },
    graph: { termType: 'DefaultGraph', value: '' }
  },
  {
    subject: {
      termType: 'NamedNode',
      value: 'urn:uuid:75f00b1f-ee04-487e-8fc7-91873fa4174a'
    },
    predicate: {
      termType: 'NamedNode',
      value: 'https://www.w3.org/2018/credentials#credentialSubject'
    },
    object: { termType: 'NamedNode', value: 'did:key:KKKKK' },
    graph: { termType: 'DefaultGraph', value: '' }
  },
  {
    subject: {
      termType: 'NamedNode',
      value: 'urn:uuid:75f00b1f-ee04-487e-8fc7-91873fa4174a'
    },
    predicate: {
      termType: 'NamedNode',
      value: 'https://www.w3.org/2018/credentials#issuanceDate'
    },
    object: {
      termType: 'Literal',
      value: '2025-05-04T12:22:39.753Z',
      datatype: [Object]
    },
    graph: { termType: 'DefaultGraph', value: '' }
  },
  {
    subject: {
      termType: 'NamedNode',
      value: 'urn:uuid:75f00b1f-ee04-487e-8fc7-91873fa4174a'
    },
    predicate: {
      termType: 'NamedNode',
      value: 'https://www.w3.org/2018/credentials#issuer'
    },
    object: {
      termType: 'NamedNode',
      value: 'did:key:z6Mkiq1TQyWPezBTGoqNvcq9b6azWMyn6HwQmbjo5LLpai68'
    },
    graph: { termType: 'DefaultGraph', value: '' }
  }
]
```