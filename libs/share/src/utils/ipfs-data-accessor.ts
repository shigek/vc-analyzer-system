import { CID, create, IPFSHTTPClient } from 'kubo-rpc-client';

export class IpfsAccessor {
  private readonly ipfsClient: IPFSHTTPClient;
  constructor(options = {}) {
    this.ipfsClient = create(options);
  }
  async fetchJsonFromIpfs(cid: string): Promise<any> {
    try {
      const asyncIterable = this.ipfsClient.cat(cid);
      const dataBuffer = Buffer.from(
        await (async () => {
          const chunks: Buffer[] = [];
          for await (const chunk of asyncIterable) {
            chunks.push(Buffer.from(chunk));
          }
          return Buffer.concat(chunks);
        })(),
      );
      const jsonString = dataBuffer.toString('utf8');
      const jsonData = JSON.parse(jsonString);
      return jsonData;
    } catch (error) {
      throw new Error(
        `Failed to get and parse IPFS data fro CID ${cid}: ${error.message}`,
      );
    }
  }
  async addJsonToIpfs(jsonData: any): Promise<CID> {
    try {
      // 1. jsonDataをストリングにする
      const jsonString = JSON.stringify(jsonData);
      // 2. utf8でBufferに変換
      const buffer = Buffer.from(jsonString, 'utf8');
      const { cid } = await this.ipfsClient.add(buffer);
      return cid;
    } catch (error) {
      throw new Error(`Failed to add data to IPFS : ${error.message}`);
    }
  }
}
