import {
  Injectable,
  OnApplicationBootstrap,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  StatusListData,
  StatusListVerifableCredential,
} from './interfaces/status-list-data.interface';
import { securityLoader } from '@digitalbazaar/security-document-loader';
import { replaceBit, searchBit } from '@share/share';
import { signedCredential } from './utils/signed-status-list-vc';
import { transferStatusListDatafromVc } from './utils/transfer-status-list-data-from-vc';
import path from 'path';
import { loadRegistry, saveRegistry } from '@share/share';
import { IpfsAccessor } from '@share/share/utils/ipfs-data-accessor';
import { verifySignature } from '@share/share/utils/jsonld-verifier';
import { randomUUID } from 'crypto';
import {
  RegistrationErrorDetails,
  VerificationErrorDetails,
} from '@share/share/interfaces/response/error-response.interface';
import {
  CODE_MESSAGES,
  ERROR_MESSAGES,
  RESOURCE_TYPE,
  ResourceArgs,
  STATUS_CODE,
} from '@share/share/common/message/error-message';
import { contexts as statusListContexts } from './context';

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
  constructor(private configService: ConfigService) {
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
    loader.addDocuments({ documents: [...statusListContexts] });
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

  async registration(
    listId: string,
    signedCredential: StatusListVerifableCredential,
    modify: boolean
  ): Promise<{ fetchedCid: string; status: string }> {
    const errors: RegistrationErrorDetails[] = [];
    try {
      // 1.登録済みの確認
      const currentStatusListCid = this.registryMap.get(listId);
      if (currentStatusListCid && !modify) {
        errors.push({
          message: `Trusted issuer with DID ${listId} already exists in registory.`,
        });
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
      // 2.IPFSへデータを登録する。
      const cid = await this.ipfsAccessor.addJsonToIpfs(signedCredential);

      // 3.Registryに登録
      this.registryMap.set(listId, cid.toString());
      await saveRegistry(this.registryMap, this.registryFilePath);
      return { fetchedCid: cid.toString(), status: STATUS_CODE.VALID };
    } catch (error) {
      this.logger.error('Error in registration:', error);
      if (error instanceof HttpException) {
        throw new HttpException(
          {
            code: 'STATUS_LIST_REGISTRATION',
            message: 'registration faild',
            registrationErrors: error.getResponse(),
          },
          error.getStatus(),
        );
      }
      throw new HttpException(
        {
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async readIpfsDataAndNotFoundError(listId: string): Promise<{
    credential: StatusListVerifableCredential;
    currentStatusListCid: string;
  }> {
    const errors: RegistrationErrorDetails[] = [];
    const resurceArgs: ResourceArgs = {
      resourceType: RESOURCE_TYPE.STATUS_LIST,
      identifier: listId,
    };
    try {
      const currentStatusListCid = this.registryMap.get(listId);
      if (!currentStatusListCid) {
        errors.push({
          message: ERROR_MESSAGES.RESOURCE_NOT_FOUND(resurceArgs),
        });
        throw new HttpException(
          { code: CODE_MESSAGES.VC_VERIFICATIN_FIELD, errors },
          HttpStatus.BAD_REQUEST,
        );
      }
      const credential = (await this.ipfsAccessor.fetchJsonFromIpfs(
        currentStatusListCid!,
      )) as StatusListVerifableCredential;
      return { credential, currentStatusListCid };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error in readIpfsData:', error);
      throw new HttpException(
        {
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async readIpfsDataAndAlredyError(
    listId: string,
  ): Promise<StatusListVerifableCredential> {
    const errors: RegistrationErrorDetails[] = [];
    try {
      const currentStatusListCid = this.registryMap.get(listId);
      if (currentStatusListCid) {
        errors.push({
          message: `Status list with List ID ${listId} already exists in registory.`,
        });
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
      const credential = (await this.ipfsAccessor.fetchJsonFromIpfs(
        currentStatusListCid!,
      )) as StatusListVerifableCredential;
      return credential;
    } catch (error) {
      if (error instanceof HttpException) {
        throw new HttpException(
          {
            code: 'STATUS_LIST_IPFS_READ_FAILD',
            message: 'already exists faild',
            registrationErrors: error.getResponse(),
          },
          error.getStatus(),
        );
      }
      this.logger.error('Error in readIpfsData:', error);
      throw new HttpException(
        {
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async verifyProofAndId(
    listId: string,
    credential: StatusListVerifableCredential,
  ): Promise<boolean> {
    const errors: VerificationErrorDetails[] = [];
    try {
      const isValidSignature = await verifySignature(
        credential,
        this.documentLoader,
      );
      if (!isValidSignature) {
        errors.push({
          status: ERROR_MESSAGES.UNKNOWN,
          message: 'Invalid status list signature.',
        });
        throw new HttpException(
          { code: CODE_MESSAGES.VC_VERIFICATIN_FIELD, errors },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      if (listId !== credential?.credentialSubject.id) {
        errors.push({
          status: ERROR_MESSAGES.UNKNOWN,
          message: `List id does not match: Req(${listId}) Res(${credential?.credentialSubject.id})`,
        });
        throw new HttpException(
          { code: CODE_MESSAGES.VC_VERIFICATIN_FIELD, errors },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error in verifyProofAndId:', error);
      throw new HttpException(
        {
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  createStatusList(bitSize: number): StatusListData {
    const byteLength = Math.ceil(bitSize / 8);
    const bitstringBuffer = Buffer.alloc(byteLength);
    const statusList: StatusListData = {
      id: `urn:${randomUUID()}`,
      statusPurpose: 'revocation',
      bitstring: bitstringBuffer,
      bitLength: this.statusListCredentialMax,
      byteLength,
    };
    return statusList;
  }

  async verifyStatus(
    index: number,
    credential: StatusListVerifableCredential,
  ): Promise<{ status: string; statusCode: number }> {
    const errors: VerificationErrorDetails[] = [];
    try {
      // 作られたデータがおかしい場合は、例外をスローする
      const statusListData = transferStatusListDatafromVc(credential, 1000);
      if (index < 0 || index >= statusListData.bitLength) {
        this.logger.error(
          `index ${index} is out of bounds for bitlength ${statusListData.bitLength}`,
        );
        errors.push({
          status: ERROR_MESSAGES.UNKNOWN,
          message:
            'index ${index} is out of bounds for bitlength ${statusListData.bitLength}',
        });
        throw new HttpException(
          { code: CODE_MESSAGES.VC_VERIFICATIN_FIELD, errors },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      // ビット列を確認する。
      const byte = searchBit(statusListData.bitstring, index);
      if (byte !== 0 && byte !== 1) {
        this.logger.error(`invalid status value: ${byte}. Must be 0 or 1.`);
        errors.push({
          status: ERROR_MESSAGES.UNKNOWN,
          message: 'invalid status value: ${byte}. Must be 0 or 1.',
        });
        throw new HttpException(
          { code: CODE_MESSAGES.VC_VERIFICATIN_FIELD, errors },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      if (errors.length) {
        throw new HttpException(
          { code: CODE_MESSAGES.VC_VERIFICATIN_FIELD, errors },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      return {
        status: byte === 1 ? 'revoked' : 'valid',
        statusCode: 200,
      };
    } catch (error) {
      this.logger.error('Error in verifyStatus:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  changeStatus(
    index: number,
    status: string,
    credential: StatusListVerifableCredential,
  ): StatusListData {
    const errors: RegistrationErrorDetails[] = [];
    try {
      const statusListData = transferStatusListDatafromVc(credential, 1000);
      if (index < 0 || index >= statusListData.bitLength) {
        errors.push({
          message: `Status list update client error (revoke or valid): ${status}`,
        });
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
      let revoked: number;
      if (status === STATUS_CODE.REVOKE) {
        revoked = 1;
      } else if (status === STATUS_CODE.VALID) {
        revoked = 0;
      } else {
        errors.push({
          message: `Status list update client error (revoke or valid): ${status}`,
        });
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
      const { byte, byteIndex } = replaceBit(
        statusListData.bitstring,
        index,
        revoked,
      );
      statusListData.bitstring[byteIndex] = byte;
      statusListData.lastUpdateAt = new Date();
      return statusListData;
    } catch (error) {
      this.logger.error('Error in changeStatus:', error);
      if (error instanceof HttpException) {
        throw new HttpException(
          {
            code: 'STATUS_LIST_CHANGE_STATUS_FAILD',
            message: 'Change status faild',
            registrationErrors: error.getResponse(),
          },
          error.getStatus(),
        );
      }
      throw new HttpException(
        {
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async issue(
    statusListData: StatusListData,
  ): Promise<StatusListVerifableCredential> {
    try {
      const signedVC = await signedCredential(
        statusListData,
        this.issuerDid,
        this.documentLoader,
      );
      return signedVC;
    } catch (error) {
      this.logger.error('Error in changeStatus:', error);
      throw new HttpException(
        {
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
