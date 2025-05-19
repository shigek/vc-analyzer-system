import {
  StatusListData,
  StatusListVerifableCredential,
} from '../interfaces/status-list-data.interface';
import { decompress } from 'lib/share/utils/gzip.utils';
export async function transferStatusListDatafromVc(
  credential: StatusListVerifableCredential,
  byteSize: number,
): Promise<StatusListData> {
  const byteLength = Math.ceil(byteSize / 8);
  const len = credential['credentialSubject'].encodedList.length;
  const decodedListBit =
    len === 0
      ? Buffer.alloc(byteLength)
      : await decompressEncodeList(
          credential['credentialSubject'].encodedList,
          'base64url',
        );
  const newStatusList: StatusListData = {
    id: credential['credentialSubject'].id,
    statusPurpose: credential['credentialSubject'].statusPurpose,
    bitstring: decodedListBit,
    bitLength: byteSize,
    byteLength,
  };
  return newStatusList;
}

async function decompressEncodeList(
  encodeList: string,
  encoding: BufferEncoding,
) {
  const encode = Buffer.from(encodeList, encoding);
  const decompressed = await decompress(encode);
  return decompressed;
}
