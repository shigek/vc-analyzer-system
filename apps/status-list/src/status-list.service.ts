import { Injectable, BadRequestException, NotFoundException, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StatusListData } from './interfaces/status-list-data.interface';
import { ShareService } from '@share/share';
import { GetStatusResponse } from './response/update';
import { createSignedStatusListCredential } from './utils/create-signed-status-list-vc';
import { create } from 'kubo-rpc-client'; // ここで落ちる

@Injectable()
export class StatusListService implements OnApplicationBootstrap {
  private readonly statusListCredentialMax: number;
  private readonly issuerDid: string;
  private readonly logger = new Logger(StatusListService.name);
  private ipfsClient: any;
  private registryMap = new Map<string, any>();
  private readonly ipfsPeerUrl: string;

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
    const url1 = this.configService.get<string>('STATUSLIST_ISSUER_DID');
    if (!url1) {
      throw new Error(
        'STATUSLIST_ISSUER_DID environment variable is not set.',
      );
    }
    this.issuerDid = url1;
    const url2 = this.configService.get<string>('IPFS_PEER_URL');
    if (!url2) {
      throw new Error(
        'IPFS_PEER_URL environment variable is not set.',
      );
    }
    this.ipfsPeerUrl = url2;
  }
  async onApplicationBootstrap() {
    this.logger.log('Application bootstrap completed. Initializing...')
    this.logger.log('Application bootstrap completed. FinishFinish'); //　これでない
    this.ipfsClient = create({url: this.ipfsPeerUrl});
  }

  async load(
    listId: string,
    index: number,
    correlationId: string,
  ): Promise<any> {
    const cid = this.registryMap.get(listId);
    if (!cid) {
      return new NotFoundException({
        message: `Status List Not found: ${cid}`,
        correlationId,
      });
    }
    return this.createNewStatusList(1000, correlationId);
  }

  async save(
    listId: string,
    signedCredential: string,
    correlationId: string,
  ): Promise<any> {
    const buffer = Buffer.from(signedCredential, 'utf8');
    const { cid } = await this.ipfsClient.add(buffer);
    this.registryMap.set(listId, cid);
    return 'Hello World!';
  }

  createNewStatusList(
    credentials: number,
    correlationId: string,
  ): StatusListData {
    const byteLength = Math.ceil(credentials >> 3);
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

  getStatus(
    statusListData: StatusListData,
    index: number,
    correlationId: string,
  ): string {
    if (index < 0 || index >= statusListData.bitLength) {
      throw new Error(
        `index ${index} is out of bounds for bitlength ${statusListData.bitLength}`,
      );
    }
    const byteIndex = Math.ceil(index >> 3);
    const bitIndex = index & 7;
    const byte = (statusListData.bitstring[byteIndex] >> bitIndex) & 1;
    if (byte !== 0 && byte !== 1) {
      throw new Error(`invalid status value: ${byte}. Must be 0 or 1.`);
    }
    const getStatusResponse: GetStatusResponse = {
      status: byte === 0 ? 'revoked' : 'valid',
    };
    return getStatusResponse.status;
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
    const byteIndex = Math.ceil(index >> 3);
    const bitIndex = index & 7;
    let byte = statusListData.bitstring[byteIndex];
    if (status === 'revoked') {
      byte = byte | (1 << bitIndex);
    } else if (status === 'valid') {
      byte = byte | ~(1 << bitIndex);
    } else {
      throw new BadRequestException({
        message: `Status list update client error (revoke or valid): ${status}`,
        correlationId,
      });
    }
    statusListData.bitstring[byteIndex] = byte;
    statusListData.lastUpdateAt = new Date();
  }

  async generateStatusListData(statusListData: StatusListData, newCorrelationId: string): Promise<any> {
    const signedVC = await createSignedStatusListCredential(statusListData, this.issuerDid);
    return JSON.stringify(signedVC);
  }
}
