import { Buffer } from 'buffer';
import { StatusListVerifableCredential } from '../interfaces/status-list-data.interface';
import { issue } from '@share/share/utils/jsonld-signer';
import { randomUUID } from 'crypto';
export async function signedCredential(
  listData: {
    id: string;
    statusPurpose: string;
    bitstring: Buffer;
    bitLength: number;
  },
  issuerDid: string,
  documentLoader: any,
): Promise<StatusListVerifableCredential> {
  const encodedListBitstring = listData.bitstring.toString('base64url');
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
    issuerDid,
    credential,
    documentLoader,
  );
  return signedCredential;
}
