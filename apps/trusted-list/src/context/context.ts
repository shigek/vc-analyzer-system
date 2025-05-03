export const context = {
  '@context': {
    '@protected': true,
    TrustedList2025Credential: {
      '@id': 'https://example.com/trasted-list/TrustedList2025Credential',
      '@context': {
        '@protected': true,

        id: '@id',
        type: '@type',

        description: 'http://schema.org/description',
        name: 'http://schema.org/name',
      },
    },
    TrastedList2025: {
      '@id': 'https://example.com/trasted-list/TrustedList2025Credential',
      '@context': {
        '@protected': true,

        id: '@id',
        type: 'TrastedList2025',

        validFrom: {
          '@id': 'https://schema.org/validFrom',
          '@type': 'https://schema.org/DateTime',
        },
        validUntil: {
          '@id': 'https://schema.org/expires',
          '@type': 'https://schema.org/DateTime',
        },
        trustedIssuerEntries: {
          '@id': 'trustedIssuerEntries',
          '@type': 'array',
        },
      },
    },
  },
};
