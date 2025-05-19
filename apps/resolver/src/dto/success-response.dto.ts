export const ResolverSuccessResponse = {
  'application/did+json': {
    schema: {
      type: 'object',
      description: 'The DID document (JSON representation).',
      example: {
        id: 'did:indy:sovrin:WRfXPg8dantKVubE3HX8pw',
        verificationMethod: [
          {
            id: 'did:indy:sovrin:WRfXPg8dantKVubE3HX8pw#key-1',
            type: 'Ed25519VerificationKey2018',
            publicKeyBase58: 'H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV',
          },
        ],
      },
    },
  },
  'application/did+ld+json': {
    schema: {
      type: 'object',
      description: 'The DID document (JSON-LD representation).',
      example: {
        '@context': 'https://www.w3.org/ns/did/v1',
        id: 'did:indy:sovrin:WRfXPg8dantKVubE3HX8pw',
        verificationMethod: [
          {
            id: 'did:indy:sovrin:WRfXPg8dantKVubE3HX8pw#key-1',
            type: 'Ed25519VerificationKey2018',
            publicKeyBase58: 'H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV',
          },
        ],
      },
    },
  },
  'application/ld+json;profile="https://w3id.org/did-resolution"': {
    schema: {
      description: 'The DID resolution result.',
      type: 'object',
      properties: {
        didDocument: {
          type: 'object',
        },
        didResolutionMetadata: {
          type: 'object',
          additionalProperties: {},
        },
        didDocumentMetadata: {
          type: 'object',
          additionalProperties: {},
        },
      },
    },
  },
};
