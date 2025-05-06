import { issue } from '@share/share/utils/jsonld-signer';
import { randomUUID } from 'crypto';
import { addYear } from '@share/share';
import { SubjectDidUpdateDto } from '../dto/subject-did-update';
import {
  CredentialSubject,
  TrustedListVerifableCredential,
} from '../interfaces/trusted-vc-data.interface';

export async function signedCredential(
  issuerDid: string,
  subjectDid: string,
  years: number,
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
    issuerDid,
    credential,
    documentLoader,
  );
  return signedCredential;
}
