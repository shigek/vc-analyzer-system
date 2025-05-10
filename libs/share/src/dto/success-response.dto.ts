import { ApiProperty } from '@nestjs/swagger';
import { AxiosError } from 'axios';
export class SuccessResponse {
  @ApiProperty({ description: 'エラーメッセージ' })
  message: string;
  @ApiProperty({ description: 'エラーメッコード' })
  code: string;
  @ApiProperty({ required: false, description: 'エラー詳細' })
  details?: AxiosError['message'];
  @ApiProperty({ description: '処理識別子' })
  correlationId: string;
}
export class AdditionalProperties {
  additionalProperties: object;
}
export class ResolutionResult {
  @ApiProperty()
  didDocument: object;
  @ApiProperty({ additionalProperties: {} })
  didResolutionMetadata: object;
  @ApiProperty({ additionalProperties: {} })
  didDocumentMetadata: object;
}
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
