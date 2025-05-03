import vc from '@digitalbazaar/vc';
import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';
import { Ed25519Signature2020 } from '@digitalbazaar/ed25519-signature-2020';
import { v4 as uuidv4 } from 'uuid';
import { addYear } from '@share/share';

export async function createSignedTrustedListCredential(
  issuerDid: string,
  subjectDid: string,
  years: number,
  documentLoader: any,
): Promise<vc.VerifableCredential> {
  const credential = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
    ],
    id: `urn:uuid:${uuidv4()}`,
    type: ['VerifiableCredential', 'TrustedListCredential'],
    issuer: issuerDid,
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: subjectDid,
      type: 'TrustedList2025',
      validFrom: new Date().toISOString(),
      trustedIssuerEntries: [
        {
          validUntil: addYear(new Date(), years),
        },
      ],
    },
  };
  const publicKeyMultibase = issuerDid.split(':')[2];
  const controller = issuerDid;
  const keyPair = await Ed25519VerificationKey2020.from({
    type: 'Ed25519VerificationKey2020',
    controller,
    id: `${controller}#${publicKeyMultibase}`,
    publicKeyMultibase,
    privateKeyMultibase:
      'zrv2uK2DewUDNDzpfPskZ38q1o25eNEbNMcMrVyFFTuQuKLToJQ9d8ncjGoeneDC1JKPY3DEuQwYnkZzthCH1Sd8e2k',
  });

  const suite = new Ed25519Signature2020({
    key: keyPair,
    date: new Date().toISOString(),
  });
  const signedCredential = await vc.issue({
    credential,
    suite,
    documentLoader,
  });
  return signedCredential;
}
