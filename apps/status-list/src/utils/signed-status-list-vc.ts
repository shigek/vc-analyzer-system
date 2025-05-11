import { Buffer } from 'buffer';
import { StatusListVerifableCredential } from '../interfaces/status-list-data.interface';
import { securityLoader } from '@digitalcredentials/security-document-loader';
import { issue } from '@share/share/utils/jsonld-signer';
import { randomUUID } from 'crypto';
import { KeyFileDataLoader } from '@share/share/common/key/provider.key';
import { compress } from '@share/share/utils/gzip.utils';
export async function signedCredential(
  listData: {
    id: string;
    statusPurpose: string;
    bitstring: Buffer;
    bitLength: number;
  },
  issuerDid: string,
  keyfileLoader: KeyFileDataLoader,
  documentLoader: any,
): Promise<StatusListVerifableCredential> {
  // 1. gizで圧縮する。
  const compressed = await compress(listData.bitstring);
  const encodedListBitstring = compressed.toString('base64url');
  const credential = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://w3id.org/vc/status-list/2021/v1',
    ],
    id: `urn:uuid:${randomUUID()}`,
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
  const signedCredential: StatusListVerifableCredential = await issue(
    keyfileLoader,
    credential,
    documentLoader,
  );
  return signedCredential;
}

export function setDocumentLoader(): any {
  const loader = securityLoader({ fetchRemoteContexts: true });
  return loader.build();
}
