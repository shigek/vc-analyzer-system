import { Buffer } from 'buffer';
import {
  StatusListData,
  StatusListVerifableCredential,
} from '../interfaces/status-list-data.interface';
export function transferStatusListDatafromVc(
  credential: StatusListVerifableCredential,
  byteSize: number,
): StatusListData {
  const byteLength = Math.ceil(byteSize / 8);
  const len = credential['credentialSubject'].encodedList.length;
  const decodedListBit =
    len === 0
      ? Buffer.alloc(byteLength)
      : Buffer.from(credential['credentialSubject'].encodedList, 'base64url');
  const newStatusList: StatusListData = {
    id: credential['credentialSubject'].id,
    statusPurpose: credential['credentialSubject'].statusPurpose,
    bitstring: decodedListBit,
    bitLength: byteSize,
    byteLength,
  };
  return newStatusList;
}
