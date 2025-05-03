import { VerifableCredential, issue } from '@digitalcredentials/vc';
import { securityLoader } from '@digitalcredentials/security-document-loader';
import { Ed25519VerificationKey2020 } from '@digitalcredentials/ed25519-verification-key-2020';
import { Ed25519Signature2020 } from '@digitalcredentials/ed25519-signature-2020';
import { Buffer } from 'buffer';
import { v4 as uuidv4 } from 'uuid';
const documentLoader = securityLoader().build();
export async function createSignedStatusListCredential(
  listData: {
    id: string;
    statusPurpose: string;
    bitstring: Buffer;
    bitLength: number;
  },
  issuerDid: string,
): Promise<VerifableCredential> {
  const encodedListBitstring = listData.bitstring.toString('base64url');
  const credential = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://w3id.org/vc/status-list/2021/v1',
    ],
    id: `urn:uuid:${uuidv4()}`,
    type: ['VerifiableCredential', 'StatusList2021Credential'],
    issuer: issuerDid,
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: listData.id,
      type: 'StatusList2021',
      statusPurpose: listData.statusPurpose,
      encodedList: encodedListBitstring,
    },
  };

  const publicKeyMultibase = issuerDid.split(':')[2];
  const controller = issuerDid;
  const keyPair = await Ed25519VerificationKey2020.from({
    type: 'Ed25519VerificationKey2020',
    controller,
    id: controller + `${issuerDid}#${publicKeyMultibase}`,
    publicKeyMultibase,
    privateKeyMultibase:
      'zrv2uK2DewUDNDzpfPskZ38q1o25eNEbNMcMrVyFFTuQuKLToJQ9d8ncjGoeneDC1JKPY3DEuQwYnkZzthCH1Sd8e2k',
  });

  const suite = new Ed25519Signature2020({
    key: keyPair,
    date: new Date().toISOString(),
  });
  const signedCredential = await issue({ credential, suite, documentLoader });
  return signedCredential;
}
