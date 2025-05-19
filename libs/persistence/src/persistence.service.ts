import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IpfsAccessor } from './common/accesser/ipfs/ipfs-data-accessor';
import { NedbCacheAccessor } from './common/accesser/key-value/nedbe.key-value';
import { DataAccesser } from './common/accesser/interfaces/data-type.intercase';
import { ERROR_MESSAGES } from 'lib/share/common/message/common-message';
import { PersistenceServiceError } from 'lib/share/common/dto/error-response.dto';

@Injectable()
export class PersistenceService {
  private providerResiger: DataAccesser;
  private providerVC: DataAccesser;
  private registryPath: string;
  constructor(private configService: ConfigService) {
    const url1 = this.configService.get<string>(
      'PERSISTENCE_REGISTER_DATA_ACCESSER',
    );
    if (!url1) {
      throw new Error(
        'PERSISTENCE_REGISTER_DATA_ACCESSER environment variable is not set.',
      );
    }
    const url2 = this.configService.get<string>(
      `PERSISTENCE_${url1}_REGISTER_DATA_URL`,
    );
    if (!url2) {
      throw new Error(
        `PERSISTENCE_${url1}_REGISTER_DATA_URL environment variable is not set.`,
      );
    }
    this.providerResiger = create[url1](url2);
    const url3 = this.configService.get<string>('PERSISTENCE_VC_DATA_ACCESSER');
    if (!url3) {
      throw new Error(
        'PERSISTENCE_VC_DATA_ACCESSER environment variable is not set.',
      );
    }
    const url4 = this.configService.get<string>(
      `PERSISTENCE_${url3}_VC_DATA_URL`,
    );
    if (!url4) {
      throw new Error(
        `PERSISTENCE_${url4}_VC_DATA_URL environment variable is not set.`,
      );
    }
    this.providerVC = create[url3](url4);
  }
  setRegistryPath(path: string): void {
    this.registryPath = path;
  }
  async loadToCacheForRegister(): Promise<void> {
    if (this.providerResiger instanceof NedbCacheAccessor) {
      await this.providerResiger.loadToCache({ path: this.registryPath });
    } else {
      throw new Error('Method not implemented. `FILE or NEDB` is available.');
    }
  }
  async isNotExistsOrThrow(key: string): Promise<any> {
    await this.providerResiger.contains({ linkKey: key });
  }

  /**
   * データの存在チェック
   *
   * @param key
   * @param onThrow 存在しない場合は例外をスローするか
   */
  async isExists(key: string, onThrow: boolean): Promise<any> {
    const result =
      (await this.providerResiger.contains({ linkKey: key })) === true;
    if (!result && onThrow) {
      const message = ERROR_MESSAGES.RESOURCE_NOT_FOUND({
        resourceType: 'metadata',
        identifier: key,
      });
      throw new PersistenceServiceError(
        { code: 'LIST_NOT_FOUND', message },
        HttpStatus.BAD_REQUEST,
      );
    }
    return result;
  }
  /**
   *
   * @param key
   * @param onThrow 存在する場合に例外をスローするか
   * @returns
   */
  async isNotExists(key: string, onThrow: boolean): Promise<any> {
    const result =
      (await this.providerResiger.contains({ linkKey: key })) === false;
    if (!result && onThrow) {
      const message = ERROR_MESSAGES.RESOURCE_ALREDY_EXISTS({
        resourceType: 'metadata',
        identifier: key,
      });
      throw new PersistenceServiceError(
        { code: 'ALREDY_EXISTS', message },
        HttpStatus.BAD_REQUEST,
      );
    }
    return result;
  }
  async getRegistryValue(key: string): Promise<any> {
    return await this.providerResiger.getValue({ linkKey: key });
  }
  async putRegistryValue(
    key: string,
    value: any,
    options?: any,
  ): Promise<void> {
    return !options
      ? await this.providerResiger.putValue({
          value: { linkKey: key, cid: value },
        })
      : await this.providerResiger.putValue({
          value: { linkKey: key, cid: value, metadata: options },
        });
  }
  async updateRegistryValue(
    key: string,
    value: any,
    options?: any,
  ): Promise<void> {
    return !options
      ? await this.providerResiger.updateValue({
          key: { linkKey: key },
          value: { cid: value },
        })
      : await this.providerResiger.updateValue({
          key: { linkKey: key },
          value: { cid: value, metadata: options },
        });
  }
  async removeRegistryValue(key: string): Promise<void> {
    return await this.providerResiger.removeValue({
      key: { linkKey: key },
    });
  }
  async getRegistryCache(): Promise<any> {
    return await this.providerResiger.getCache();
  }
  async getVC(key: string): Promise<any> {
    try {
      if (this.providerVC instanceof IpfsAccessor) {
        const vc = await this.providerVC.getValue({ key });
        if (!vc) {
          const message = ERROR_MESSAGES.DOWNLOAD_ERROR({
            resourceType: 'ipfs',
            identifier: key,
          });
          throw new PersistenceServiceError(
            {
              code: 'PERSISTENCE_SERVICE_ERROR',
              message,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        return vc;
      } else {
        throw new PersistenceServiceError(
          {
            code: 'PERSISTENCE_SERVICE_ERROR',
            message: 'Method not implemented. Only `IPFS` is available.',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      throw error;
    }
  }
  async putVC(value: any): Promise<any> {
    try {
      if (this.providerVC instanceof IpfsAccessor) {
        const cid = await this.providerVC.putValue({ value });
        if (!cid) {
          const message = ERROR_MESSAGES.UPLOAD_ERROR({
            resourceType: 'ipfs',
            identifier: '',
          });
          throw new PersistenceServiceError(
            {
              code: 'PERSISTENCE_SERVICE_ERROR',
              message,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        return cid;
      } else {
        throw new PersistenceServiceError(
          {
            code: 'PERSISTENCE_SERVICE_ERROR',
            message: 'Method not implemented. Only `IPFS` is available.',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      throw error;
    }
  }
}
const create = {
  IPFS: (url: string) => new IpfsAccessor(url),
  NEDB: (url: string) => new NedbCacheAccessor(url),
};
