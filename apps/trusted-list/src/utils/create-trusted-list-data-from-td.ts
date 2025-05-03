import { Buffer } from 'buffer';
import { TrustedListData } from '../interfaces/trusted-list-data.interface';
export function createTrustedListData(
  credential: any,
  credentials: number,
): TrustedListData {
  const byteLength = Math.ceil(credentials / 8);
  const len = credential['credentialSubject'].encodedList.length;
  const decodedListBit =
    len === 0
      ? Buffer.alloc(byteLength)
      : Buffer.from(credential['credentialSubject'].encodedList, 'base64url');
  const newStatusList: TrustedListData = {
    id: credential.id,
    statusPurpose: credential['credentialSubject'].statusPurpose,
    bitstring: decodedListBit,
    bitLength: credentials,
    byteLength,
  };
  return newStatusList;
}
