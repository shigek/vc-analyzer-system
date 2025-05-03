import {
  Injectable,
  BadRequestException,
  OnApplicationBootstrap,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StatusListData } from './interfaces/status-list-data.interface';
import { securityLoader } from '@digitalbazaar/security-document-loader';
import { replaceBit, searchBit, ShareService } from '@share/share';
import { createSignedStatusListCredential } from './utils/create-signed-status-list-vc';
import { createStatusListDatafromVc } from './utils/create-status-list-data-from-vc';
import path from 'path';
import { loadRegistry, saveRegistry, ResponseDao } from '@share/share';
import { IpfsAccessor } from '@share/share/utils/ipfs-data-accessor';
import { verifyStatusListSignature } from './utils/vc-verifier';

@Injectable()
export class StatusListService implements OnApplicationBootstrap {
  private documentLoader: any;
  private readonly statusListCredentialMax: number;
  private readonly issuerDid: string;
  private readonly logger = new Logger(StatusListService.name);
  private ipfsAccessor: IpfsAccessor;
  private registryMap: Map<string, string>;
  private readonly ipfsPeerUrl: string;
  private registryFilePath: string;
  private responseDao: ResponseDao = {
    serviceMetaData: {},
  };
  constructor(
    private configService: ConfigService,
    private shareService: ShareService,
  ) {
    const url0 = this.configService.get<string>('STATUS_LIST_CREDENTIA_MAX');
    if (!url0) {
      throw new Error(
        'STATUS_LIST_CREDENTIA_MAX environment variable is not set.',
      );
    }
    this.statusListCredentialMax = parseInt(url0);
    const url1 = this.configService.get<string>(
      'STATUSLIST_SERVICE_PROVIDER_DID',
    );
    if (!url1) {
      throw new Error(
        'STATUSLIST_SERVICE_PROVIDER_DID environment variable is not set.',
      );
    }
    this.issuerDid = url1;
    const url2 = this.configService.get<string>('IPFS_PEER_URL');
    if (!url2) {
      throw new Error('IPFS_PEER_URL environment variable is not set.');
    }
    this.ipfsPeerUrl = url2;
    const url3 = this.configService.get<string>('REGISTRY_DATA_PATH');
    if (!url3) {
      throw new Error('REGISTRY_DATA_PATH environment variable is not set.');
    }
    this.registryFilePath = path.join(
      __dirname,
      url3,
      'data',
      'status-list-registry.json',
    );
    const loader = securityLoader();
    this.documentLoader = loader.build();
  }
  async onApplicationBootstrap() {
    this.logger.log('Application bootstrap completed. Initializing...');
    this.ipfsAccessor = new IpfsAccessor({ url: this.ipfsPeerUrl });
    this.logger.log('Application bootstrap completed. FinishFinish');
    await this.load();
  }

  async load(): Promise<void> {
    try {
      this.registryMap = await loadRegistry(this.registryFilePath);
    } catch (error) {
      this.logger.error('Error loading registry on startup:', error);
    }
  }

  async save(
    listId: string,
    signedCredential: any,
    correlationId: string,
  ): Promise<void> {
    const cid = await this.ipfsAccessor.addJsonToIpfs(signedCredential);
    this.registryMap.set(listId, cid.toString());
    try {
      await saveRegistry(this.registryMap, this.registryFilePath);
    } catch (error) {
      this.logger.error('Error saving registry after update:', error);
    }
  }

  createNewStatusList(
    credentials: number,
    correlationId: string,
  ): StatusListData {
    const byteLength = Math.ceil(credentials / 8);
    const bitstringBuffer = Buffer.alloc(byteLength);
    const newStatusList: StatusListData = {
      id: `urn:${this.shareService.generateUUID()}`,
      statusPurpose: 'revocation',
      bitstring: bitstringBuffer,
      bitLength: this.statusListCredentialMax,
      byteLength,
    };
    return newStatusList;
  }

  async verifyStatus(
    listId: string,
    index: number,
    correlationId: string,
  ): Promise<any> {
    // 1.データを取得する
    const {
      credential,
      error,
      status,
    }: { credential?: any; status: boolean; error?: string } =
      await this.fetch(listId);
    if (!status) {
      this.logger.error(`${error}`);
      return { ...this.responseDao, status: 'unknown' };
    }
    // 2. 作成者の署名検証
    const isValid = await verifyStatusListSignature(
      credential,
      this.documentLoader,
    );

    //3．作られたデータがおかしい場合は、例外をスローする
    const statusListData = createStatusListDatafromVc(credential, 1000);
    if (index < 0 || index >= statusListData.bitLength) {
      this.logger.error(
        `index ${index} is out of bounds for bitlength ${statusListData.bitLength}`,
      );
      return { ...this.responseDao, status: 'unknown' };
    }
    //1．ビット列を確認する。
    const byte = searchBit(statusListData.bitstring, index);
    if (byte !== 0 && byte !== 1) {
      this.logger.error(`invalid status value: ${byte}. Must be 0 or 1.`);
      return { ...this.responseDao, status: 'unknown' };
    }
    return { ...this.responseDao, status: byte === 1 ? 'revoked' : 'valid' };
  }

  setStatus(
    statusListData: StatusListData,
    index: number,
    status: string,
    correlationId: string,
  ): void {
    if (index < 0 || index >= statusListData.bitLength) {
      throw new Error(
        `index ${index} is out of bounds for bitlength ${statusListData.bitLength}`,
      );
    }
    let revoked: number;
    if (status === 'revoked') {
      revoked = 1;
    } else if (status === 'valid') {
      revoked = 0;
    } else {
      throw new BadRequestException({
        message: `Status list update client error (revoke or valid): ${status}`,
        correlationId,
      });
    }
    const { byte, byteIndex } = replaceBit(
      statusListData.bitstring,
      index,
      revoked,
    );
    statusListData.bitstring[byteIndex] = byte;
    statusListData.lastUpdateAt = new Date();
  }

  async generateStatusListData(
    statusListData: StatusListData,
    newCorrelationId: string,
  ): Promise<any> {
    const signedVC = await createSignedStatusListCredential(
      statusListData,
      this.issuerDid,
    );
    return JSON.stringify(signedVC);
  }

  private async fetch(listId: string): Promise<any> {
    const cid = this.registryMap.get(listId);
    if (!cid) {
      return { status: false };
    }
    try {
      const credential = await this.ipfsAccessor.fetchJsonFromIpfs(cid);
      return { status: true, credential };
    } catch (error) {
      return { status: false, error: error.message };
    }
  }
}
