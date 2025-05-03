import { Buffer } from 'buffer';
import { StatusListData } from '../interfaces/status-list-data.interface';
export function createStatusListDatafromVc(
  credential: any,
  credentials: number,
): StatusListData {
  const byteLength = Math.ceil(credentials / 8);
  const len = credential['credentialSubject'].encodedList.length;
  const decodedListBit =
    len === 0
      ? Buffer.alloc(byteLength)
      : Buffer.from(credential['credentialSubject'].encodedList, 'base64url');
  const newStatusList: StatusListData = {
    id: credential.id,
    statusPurpose: credential['credentialSubject'].statusPurpose,
    bitstring: decodedListBit,
    bitLength: credentials,
    byteLength,
  };
  return newStatusList;
}
