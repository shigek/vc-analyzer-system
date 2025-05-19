import { issue } from 'lib/share/utils/jsonld-signer';
import { randomUUID } from 'crypto';
import { addYear } from 'lib/share';
import { TrustedListVerifableCredential } from '../interfaces/trusted-vc-data.interface';
import { securityLoader } from '@digitalcredentials/security-document-loader';
import { constants, context } from 'apps/trusted-list/src/context';
import { KeyFileDataLoader } from 'lib/share/common/key/provider.key';

export async function newCredentialSined(
  issuerDid: string,
  subjectDid: string,
  years: number,
  keyFileLoader: KeyFileDataLoader,
  documentLoader: any,
): Promise<TrustedListVerifableCredential> {
  const credential = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
      'https://vc-analyzer.example.com/contexts/trusted-list/v1',
    ],
    id: `urn:uuid:${randomUUID()}`,
    type: ['VerifiableCredential', 'TrustedListCredential'],
    issuer: issuerDid,
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: subjectDid,
      type: 'TrustedList2025',
      validFrom: new Date().toISOString(),
      trustedIssuerEntry: {
        validUntil: addYear(new Date(), years).toISOString(),
      },
    },
  };
  const signedCredential: TrustedListVerifableCredential = await issue(
    keyFileLoader,
    credential,
    documentLoader,
  );
  return signedCredential;
}
export async function updateCredentialSigned(
  credential: TrustedListVerifableCredential,
  keyFileLoader: KeyFileDataLoader,
  documentLoader: any,
): Promise<TrustedListVerifableCredential> {
  const signedCredential: TrustedListVerifableCredential = await issue(
    keyFileLoader,
    credential,
    documentLoader,
  );
  return signedCredential;
}
export function setDocumentLoader(): any {
  // ＠＠＠動かない
  // loader.setProtocolHandler({protocol: 'https', handler: jsonld.documentLoader});
  const loader = securityLoader();
  loader.addStatic(constants.CONTEXT_URL, context);
  const documentLoader = loader.build();
  return documentLoader;
}
