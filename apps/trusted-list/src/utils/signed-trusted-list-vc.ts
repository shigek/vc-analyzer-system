import { issue } from '@share/share/utils/jsonld-signer';
import { randomUUID } from 'crypto';
import { addYear } from '@share/share';
import { SubjectDidUpdateDto } from '../dto/subject-did-update';
import {
  CredentialSubject,
  TrustedListVerifableCredential,
} from '../interfaces/trusted-vc-data.interface';

export async function createSignedTrustedListCredential(
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
export async function updateSignedTrustedListCredential(
  issuerDid: string,
  subjectDid: string,
  updateData: SubjectDidUpdateDto,
  credential: TrustedListVerifableCredential,
  documentLoader: any,
): Promise<TrustedListVerifableCredential> {
  // 1 credentialから、credentialSubjectを取り出す。
  const credentialSubject = credential.credentialSubject as CredentialSubject;
  // 2. データのバリデーション

  // 3. カレントの情報を更新します。
  if (updateData.validUntil) {
    credentialSubject.trustedIssuerEntry.validUntil = updateData.validUntil;
  }
  if (updateData.policy) {
    credentialSubject.trustedIssuerEntry.policy = updateData.policy;
  }
  credential.credentialSubject.trustedIssuerEntry =
    credentialSubject.trustedIssuerEntry;
  delete credential.proof; // proofは新規になるのでいったん削除
  const signedCredential: TrustedListVerifableCredential = await issue(
    issuerDid,
    credential,
    documentLoader,
  );
  return signedCredential;
}
