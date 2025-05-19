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
import { replaceBit, searchBit } from 'lib/share';
import {
  setDocumentLoader,
  signedCredential,
} from './utils/signed-status-list-vc';
import { transferStatusListDatafromVc } from './utils/transfer-status-list-data-from-vc';
import { verifySignature } from 'lib/share/utils/jsonld-verifier';
import { randomUUID } from 'crypto';
import { GeneralErrorDetails } from 'lib/share/interfaces/response/error-response.interface';
import {
  CODE_MESSAGES,
  ERROR_MESSAGES,
  STATUS_CODE,
} from 'lib/share/common/message/common-message';
import {
  fileLoader,
  KeyFileDataLoader,
} from 'lib/share/common/key/provider.key';
import { PersistenceService } from 'lib/persistence';
import { StatusListCreateDto } from './dto/status-list-create.dto';
import {
  getCodetoName,
  getMapping,
  getNametoCode,
} from './config/bitmapping.config';
import { StatusListUpdateDto } from './dto/status-list-update.dto';
import { createVC } from './common/vc/template.vc';
import { PersistenceServiceError } from 'lib/share/common/dto/error-response.dto';

@Injectable()
export class StatusListService implements OnApplicationBootstrap {
  private documentLoader: any;
  private readonly statusListCredentialMax: number;
  private readonly logger = new Logger(StatusListService.name);
  private readonly keyFileLoader: KeyFileDataLoader;
  private readonly issuerDid: string;
  constructor(
    private configService: ConfigService,
    private readonly persistenceService: PersistenceService,
  ) {
    const url0 = this.configService.get<string>('STATUSLIST_CREDENTIA_MAX');
    if (!url0) {
      throw new Error(
        'STATUSLIST_CREDENTIA_MAX environment variable is not set.',
      );
    }
    this.statusListCredentialMax = parseInt(url0);
    const url1 = this.configService.get<string>(
      'STATUSLIST_SERVICE_PROVIDER_KEY_DATA',
    );
    if (!url1) {
      throw new Error(
        'STATUSLIST_SERVICE_PROVIDER_KEY_DATA environment variable is not set.',
      );
    }
    const url2 = this.configService.get<string>(
      'STATUSLIST_SERVICE_REGISTRATION_PATH',
    );
    if (!url2) {
      throw new Error(
        'STATUSLIST_SERVICE_REGISTRATION_PATH environment variable is not set.',
      );
    }
    this.persistenceService.setRegistryPath(url2);
    const { loader, key } = fileLoader(url1);
    this.issuerDid = key;
    this.keyFileLoader = loader;
    this.documentLoader = setDocumentLoader();
  }
  async onApplicationBootstrap() {
    this.logger.log('Application bootstrap completed. Initializing...');
    await this.load();
    this.logger.log('Application bootstrap completed. Finish');
  }
  async load(): Promise<void> {
    try {
      await this.persistenceService.loadToCacheForRegister();
    } catch (error) {
      this.logger.error('Error loading registry on startup:', error);
    }
  }

  /**
   * ステータスリストの新規作成
   *
   * @param listId
   * @param signedCredential
   * @param metadata
   * @returns
   */
  async createExecute(createDto: StatusListCreateDto): Promise<{
    cid: string;
    statusListData: StatusListData;
    status: string;
  }> {
    //0. リクエストペイロードのチェック
    const statusPurpose = createDto.statusPurpose || 'revocation';
    const size = createDto.size || 131072;
    const bits = createDto.bits || 1;
    const bitMapping = createDto.bitMapping || getMapping(statusPurpose, bits);
    return await this.create({
      statusPurpose,
      size,
      bits,
      bitMapping,
    });
  }

  /**
   * ステータスリスト状態確認
   *
   * @param index
   * @param credential
   * @returns
   */
  async verifyExecute(
    listId: string,
    index: number,
  ): Promise<{ status: string; bitValue: number; cid: string }> {
    const errors: GeneralErrorDetails[] = [];
    try {
      //1. ファイル読む
      const { credential, cid, metadata } = await this.read(listId);
      if (metadata.indexes) {
        if (!metadata.indexes.includes(index)) {
          // 同じではない場合は、from,toの範囲のindexが指定された場合は、エラーとする
          const checked = this.checkReservedIndex(index, metadata);
          if (!checked) {
            throw new HttpException(
              {
                code: `STATUS_INDEX_MISALIGNMENT`,
                message: 'Status index misalignment detected.',
              },
              HttpStatus.BAD_REQUEST,
            );
          }
        }
      }
      //2. 署名検証と、listIdのチェック
      await this.verifyProofAndId(listId, credential);
      //3. 本番データを、ワークに転送
      const statusListData = await transferStatusListDatafromVc(
        credential,
        metadata.size,
      );

      //4. ステータスをチェックする。
      const byte = searchBit(statusListData.bitstring, index, metadata.bits);
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

      if (errors.length) {
        throw new HttpException(
          { code: CODE_MESSAGES.VC_VERIFICATIN_FIELD, errors },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      const status = getCodetoName(byte, metadata.bitMapping);
      return { status, bitValue: byte, cid };
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

  /**
   * ステータスリスト状態更新
   *
   * @param listId
   * @param index
   * @param updateDao
   */
  async updateExecute(
    listId: string,
    index: number,
    updateDto: StatusListUpdateDto,
  ): Promise<{ status: string; changedValue: number; cid: string }> {
    return await this.update(listId, index, updateDto);
  }

  private async read(listId: string): Promise<{
    credential: StatusListVerifableCredential;
    cid: string;
    metadata: { [index: string]: any };
  }> {
    try {
      // 1. データの存在をチェックする(存在しない場合は例外スロー)
      await this.persistenceService.isExists(listId, true);
      // 2. RegistryからCIDをデータを取得
      const { cid, metadata } =
        await this.persistenceService.getRegistryValue(listId);
      // 3.PersistenceServiceを用いてデータを保存する。
      const credential = (await this.persistenceService.getVC(
        cid,
      )) as StatusListVerifableCredential;
      return { credential, cid, metadata };
    } catch (error) {
      this.logger.error('Error in read:', error);
      if (error instanceof HttpException) {
        throw new HttpException(
          {
            code: 'STATUS_LIST_READ_SERVICE_FAILD',
            message: 'read servce faild',
            generalErrors: error.getResponse(),
          },
          error.getStatus(),
        );
      }
      if (error instanceof PersistenceServiceError) {
        throw new HttpException(
          {
            code: 'PERSISTENCE_SERVICE_FAILD',
            message: 'read servce faild',
            generalErrors: error.getResponse(),
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

  private async create(createDto: { [index: string]: any }): Promise<{
    cid: string;
    statusListData: StatusListData;
    status: string;
  }> {
    try {
      //1.空のStatusListDataを作る
      const statusListData: StatusListData = this.createStatusList(
        createDto.size,
        createDto.statusPurpose,
      );

      //2.登録済みの確認(存在する場合は例外をスロー)
      await this.persistenceService.isNotExists(statusListData.id, true);

      //3.署名を打つ
      const signedCredential = await this.issue(statusListData);

      //3.登録する
      const cid = await this.persistenceService.putVC(signedCredential);
      const metadata = {
        bitMapping: createDto.bitMapping,
        size: createDto.size,
        bits: createDto.bits,
        statusPurpose: createDto.statusPurpose,
      };
      // 3.Registryに登録
      await this.persistenceService.putRegistryValue(
        statusListData.id,
        cid.toString(),
        metadata,
      );
      return {
        cid: cid.toString(),
        statusListData,
        status: STATUS_CODE.VALID,
      };
    } catch (error) {
      this.logger.error('Error in createExecute:', error);
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
  private async update(
    listId: string,
    index: number,
    updateDto: StatusListUpdateDto,
  ): Promise<{ status: string; changedValue: number; cid: string }> {
    try {
      //1.ファイル読み込む
      const { credential, metadata } = await this.read(listId);
      if (!metadata.indexes) {
        metadata.indexes = [];
      }
      if (!metadata.indexes.includes(index)) {
        // 同じではない場合は、from,toの範囲のindexが指定された場合は、エラーとする
        const checked = this.checkReservedIndex(index, metadata);
        if (!checked) {
          throw new HttpException(
            {
              message:
                'Cannot assign status index: The specified range is already allocated.',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
        metadata.indexes.push(index);
      }

      //2.署名検証と、listIdのチェック
      await this.verifyProofAndId(listId, credential);

      //3.ステータスを更新する
      const { changedValue, statusListData, status } = await this.changeStatus(
        index,
        updateDto.status,
        credential,
        metadata,
      );
      //4.署名を打つ
      const signedCredential = await this.issue(statusListData);

      //5.更新する
      //5.PersistenceServiceを用いてデータを保存する。
      const cid = await this.persistenceService.putVC(signedCredential);
      //6.Registryに登録
      await this.persistenceService.updateRegistryValue(
        listId,
        cid.toString(),
        { ...metadata },
      );

      return { cid, changedValue, status };
    } catch (error) {
      this.logger.error('Error in update:', error);
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
  async delete(listId: string): Promise<any> {
    try {
      // 1. RegistryからsubjectDidを削除
      await this.persistenceService.removeRegistryValue(listId);
      return { listId };
    } catch (error) {
      this.logger.error('Error in deleteRegistry:', error);
      throw new HttpException(
        {
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  private async verifyProofAndId(
    listId: string,
    credential: StatusListVerifableCredential,
  ): Promise<boolean> {
    const errors: GeneralErrorDetails[] = [];
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

  private createStatusList(
    bitSize: number,
    statusPurpose: string,
  ): StatusListData {
    const byteLength = Math.ceil(bitSize / 8);
    const bitstringBuffer = Buffer.alloc(byteLength);
    const statusList: StatusListData = {
      id: `urn:${randomUUID()}`,
      statusPurpose: statusPurpose,
      bitstring: bitstringBuffer,
      bitLength: this.statusListCredentialMax,
      byteLength,
    };
    return statusList;
  }

  private async changeStatus(
    index: number,
    status: string,
    credential: StatusListVerifableCredential,
    metadata: any,
  ): Promise<{
    changedValue: number;
    statusListData: StatusListData;
    status: string;
  }> {
    const errors: GeneralErrorDetails[] = [];
    try {
      const statusListData = await transferStatusListDatafromVc(
        credential,
        metadata.size,
      );
      if (index < 0 || index + metadata.bits >= statusListData.bitLength) {
        errors.push({
          message: `Unable to determine credential status: Invalid status index or size provided.`,
        });
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
      const value = getNametoCode(status, metadata.bitMapping);
      if (!value) {
        errors.push({
          message: `Status change failed: Credential's current status is undefined.`,
        });
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
      const changedValue = parseInt(value);
      const { byte, byteIndex } = replaceBit(
        statusListData.bitstring,
        index,
        metadata.bits,
        changedValue,
      );
      statusListData.bitstring[byteIndex] = byte;
      statusListData.lastUpdateAt = new Date();
      return { changedValue, statusListData, status };
    } catch (error) {
      this.logger.error('Error in changeStatus:', error);
      if (error instanceof HttpException) {
        throw new HttpException(
          {
            code: 'STATUS_LIST_CHANGE_STATUS_FAILD',
            message: 'Change status faild',
            generalErrors: error.getResponse(),
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
  private async issue(
    statusListData: StatusListData,
  ): Promise<StatusListVerifableCredential> {
    try {
      const credential = await createVC['bitstring'](
        statusListData.statusPurpose,
        statusListData.bitstring,
        statusListData.id,
        this.issuerDid,
      );
      const signedVC = await signedCredential(
        credential,
        this.keyFileLoader,
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
  private checkReservedIndex(index: number, metadata: any): boolean {
    if (metadata.indexes) {
      if (metadata.indexes.includes(index)) {
        return true;
      } else {
        const from = index - metadata.bits + 1;
        const to = index + metadata.bits - 1;
        for (let i = from; i < index; i++) {
          if (metadata.indexes.includes(i)) {
            return false;
          }
        }
        for (let i = index + 1; i <= to; i++) {
          if (metadata.indexes.includes(i)) {
            return false;
          }
        }
      }
    }
    return true;
  }
}
