import { randomUUID } from 'crypto';
import { StatusListVerifableCredential } from '../../interfaces/status-list-data.interface';
import { compress } from 'lib/share/utils/gzip.utils';

export const createVC = {
  status2021: async (
    statusPurpose: string,
    bitstring: Buffer,
    subjectDid: string,
    issuerDid: string,
  ) => await getStatus2021(statusPurpose, bitstring, subjectDid, issuerDid),
  bitstring: async (
    statusPurpose: string,
    bitstring: Buffer,
    subjectDid: string,
    issuerDid: string,
  ) => await getBitstring(statusPurpose, bitstring, subjectDid, issuerDid),
};

const getStatus2021 = async (
  statusPurpose: string,
  bitstring: Buffer,
  subjectDid: string,
  issuerDid: string,
): Promise<StatusListVerifableCredential> => {
  const compressed = await compress(bitstring);
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
      id: subjectDid,
      type: 'StatusList2021',
      statusPurpose: statusPurpose,
      encodedList: encodedListBitstring,
    },
  };
  return credential;
};
const getBitstring = async (
  statusPurpose: string,
  bitstring: Buffer,
  subjectDid: string,
  issuerDid: string,
): Promise<StatusListVerifableCredential> => {
  const compressed = await compress(bitstring);
  const encodedListBitstring = compressed.toString('base64url');
  const credential = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://www.w3.org/ns/credentials/status/v1',
    ],
    id: `urn:uuid:${randomUUID()}`,
    type: ['VerifiableCredential', 'BitstringStatusListCredential'],
    issuer: issuerDid,
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: subjectDid,
      type: 'BitstringStatusList',
      statusPurpose: statusPurpose,
      encodedList: encodedListBitstring,
    },
  };
  return credential;
};
