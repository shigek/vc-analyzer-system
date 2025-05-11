import { gzip, ungzip } from 'node-gzip';

export async function compress(rawData: Buffer) {
  const compressed = await gzip(rawData);
  return compressed;
}
export async function decompress(compressed: Buffer) {
  const decompressed = await ungzip(compressed);
  return decompressed;
}
