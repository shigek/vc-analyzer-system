import { CID, create, IPFSHTTPClient } from 'kubo-rpc-client';
import { DataAccesser } from '../interfaces/data-type.intercase';
import { PersistenceServiceError } from 'lib/share/common/dto/error-response.dto';
import { HttpStatus } from '@nestjs/common';

export class IpfsAccessor implements DataAccesser {
  private readonly ipfsClient: IPFSHTTPClient;
  constructor(options = {}) {
    this.ipfsClient = create(options);
  }
  updateValue(_options: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getCache(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  removeValue(_optins: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
  async getValue(options: { key: string }): Promise<any> {
    try {
      const asyncIterable = this.ipfsClient.cat(options.key);
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
      if (error.cause) {
        throw new PersistenceServiceError(
          {
            code: `IPFS_ACCESS_FAILD`,
            message: `Internal service is currently unavailable. : ${error.cause.code}`,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new Error(
        `Failed to get and parse IPFS data fro CID ${options.key}: ${error.message}`,
      );
    }
  }
  async putValue(options: { value: any }): Promise<CID> {
    try {
      // 1. jsonDataをストリングにする
      const jsonString = JSON.stringify(options.value);
      // 2. utf8でBufferに変換
      const buffer = Buffer.from(jsonString, 'utf8');
      const { cid } = await this.ipfsClient.add(buffer);
      return cid;
    } catch (error) {
      if (error.cause) {
        throw new PersistenceServiceError(
          {
            code: `IPFS_ACCESS_FAILD`,
            message: `Internal service is currently unavailable. : ${error.cause.code}`,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new Error(`Failed to add data to IPFS : ${error.message}`);
    }
  }
  loadToCache(_options: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
  saveFromCache(_options: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async contains(_options: any): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
