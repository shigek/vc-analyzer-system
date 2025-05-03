export const context = {
  '@context': {
    '@protected': true,
    TrastedList2025Credential: {
      '@id': 'http://example.com/vc/trasted-list#TrastedList2025Credential',
      '@context': {
        '@protected': true,
        id: '@id',
        type: '@type',
        description: 'http://schema.org/description',
        name: 'http://schema.org/name',
        cred: 'https://www.w3.org/2018/credentials#',
        xsd: 'http://www.w3.org/2001/XMLSchema#',
      },
    },
    TrustedList2025: {
      '@id': 'http://example.com/vc/trasted-list#TrustedList2025',
      '@context': {
        '@protected': true,
        id: '@id',
        type: '@type',
        trustedIssuerEntries:
          'http://example.com/vc/trasted-list#TrustedIssuerEntries',
        cred: 'https://www.w3.org/2018/credentials#',
      },
      validFrom: {
        '@id': 'cred:validFrom',
        '@type': 'xsd:dateTime',
      },
    },
    TrustedIssuerEntries: [
      {
        '@id': 'http://example.com/vc/trasted-list#TrustedIssuerEntries',
        '@context': {
          '@protected': true,
          id: '@id',
          type: '@type',
          cred: 'https://www.w3.org/2018/credentials#',
        },
        validUntil: {
          '@id': 'cred:validUntil',
          '@type': 'xsd:dateTime',
        },
      },
    ],
  },
};
