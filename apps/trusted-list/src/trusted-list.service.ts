import {
  Injectable,
  OnApplicationBootstrap,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validateDid, isAfterDay } from 'lib/share';
import {
  newCredentialSined,
  setDocumentLoader,
  updateCredentialSigned,
} from './utils/signed-trusted-list-vc';
import { verifySignature } from 'lib/share/utils/jsonld-verifier';
import {
  CredentialSubject,
  TrustedIssuerEntry,
  TrustedListVerifableCredential,
} from './interfaces/trusted-vc-data.interface';
import { GeneralErrorDetails } from 'lib/share/interfaces/response/error-response.interface';
import {
  ERROR_MESSAGES,
  ENVIRONMENT_MESSAGES,
  ResourceArgs,
  CODE_MESSAGES,
  RESOURCE_TYPE,
  TRUSTED_CODE,
} from 'lib/share/common/message/common-message';
import {
  fileLoader,
  KeyFileDataLoader,
} from 'lib/share/common/key/provider.key';
import { PersistenceService } from 'lib/persistence';
import { SubjectDidRegistrationDto } from './dto/subject-did-registration';
import { PersistenceServiceError } from 'lib/share/common/dto/error-response.dto';
import { SubjectDidUpdateDto } from './dto/subject-did-update';
import { RegistryTableSchema } from 'lib/persistence/common/accesser/interfaces/registry-table.intercase';
interface ListData {
  trustedIssuer: string;
  status: string;
  metadata: { verifableCredentialUrl: string; fetchedCid: string };
}

@Injectable()
export class TrustedListService implements OnApplicationBootstrap {
  private readonly licenseExpiration: number;
  private readonly issuerDid: string;
  private readonly logger = new Logger(TrustedListService.name);
  private documentLoader: any;
  private readonly keyFileLoader: KeyFileDataLoader;
  private readonly ipfsGatewayUrl: string;

  constructor(
    private configService: ConfigService,
    private readonly persistenceService: PersistenceService,
  ) {
    const url0 = this.configService.get<string>(
      'TRUSTEDLIST_REGISTRATION_LICENSE_EXPIRATION',
    );
    if (!url0) {
      throw new Error(
        ENVIRONMENT_MESSAGES.RESOURCE_NOT_FOUND(
          'TRUSTEDLIST_REGISTRATION_LICENSE_EXPIRATION',
        ),
      );
    }
    this.licenseExpiration = parseInt(url0);
    const url1 = this.configService.get<string>(
      'TRUSTEDLIST_SERVICE_PROVIDER_KEY_DATA',
    );
    if (!url1) {
      throw new Error(
        ENVIRONMENT_MESSAGES.RESOURCE_NOT_FOUND(
          'TRUSTEDLIST_SERVICE_PROVIDER_KEY_DATA',
        ),
      );
    }
    const url2 = this.configService.get<string>(
      'TRUSTEDLIST_SERVICE_REGISTRATION_PATH',
    );
    if (!url2) {
      throw new Error(
        'TRUSTEDLIST_SERVICE_REGISTRATION_PATH environment variable is not set.',
      );
    }
    this.persistenceService.setRegistryPath(url2);
    const url3 = this.configService.get<string>('IPFS_GATEWAY_URL');
    if (!url3) {
      throw new Error('IPFS_GATEWAY_URL environment variable is not set.');
    }
    this.ipfsGatewayUrl = url3;

    const { loader, key } = fileLoader(url1);
    this.issuerDid = key;
    this.keyFileLoader = loader;
    this.documentLoader = setDocumentLoader();
  }
  async onApplicationBootstrap() {
    this.logger.log('Application bootstrap completed. Initializing...');
    await this.load();
    this.logger.log('Application bootstrap completed. FinishFinish');
  }
  async load(): Promise<void> {
    try {
      await this.persistenceService.loadToCacheForRegister();
    } catch (error) {
      this.logger.error('Error loading registry on startup:', error);
    }
  }
  /**
   *
   * @param createDto
   * @returns
   */
  async createExecute(createDto: SubjectDidRegistrationDto): Promise<{
    cid: string;
  }> {
    try {
      const { subjectDid } = createDto;
      // 1. didのバリデーションチェック
      this.validateDid(subjectDid);

      //2.署名を打つ
      const signedCredential = (await this.issue({
        subjectDid,
      })) as TrustedListVerifableCredential;

      //3.登録済みの確認(存在する場合は例外をスロー)
      await this.persistenceService.isNotExists(subjectDid, true);

      //4.PersistenceServiceを用いてデータを保存する。
      const cid = await this.persistenceService.putVC(signedCredential);

      //5.Registryに登録
      await this.persistenceService.putRegistryValue(
        subjectDid,
        cid.toString(),
      );
      return { cid: cid.toString() };
    } catch (error) {
      this.logger.error('Error in createExecute:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof PersistenceServiceError) {
        throw new HttpException(
          {
            code: 'PERSISTENCE_SERVICE_FAILD',
            message: 'data access field',
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
  async updateExecute(
    subjectDid: string,
    updateDto: SubjectDidUpdateDto,
  ): Promise<{
    cid: string;
    validUntil?: string;
  }> {
    try {
      const { validUntil, policy } = updateDto;
      // 1. didのバリデーションチェック
      this.validateDid(subjectDid);

      // 2. 有効期限のバリデーション
      this.validateValidUnit(validUntil);

      //3.ファイル読み込む
      const { credential } = await this.read(subjectDid);

      //4.署名検証と、subjectDidのチェック
      await this.verifyProofAndId(subjectDid, credential);

      //5. credentialSubjectを変更する
      const credentialSubject =
        credential.credentialSubject as CredentialSubject;
      if (validUntil) {
        credentialSubject.trustedIssuerEntry.validUntil = validUntil;
      }
      if (policy) {
        credentialSubject.trustedIssuerEntry.policy = policy;
      }
      credential.credentialSubject.trustedIssuerEntry =
        credentialSubject.trustedIssuerEntry;
      delete credential.proof; // proofは新規になるのでいったん削除

      //6.署名を打つ
      const signedCredential = (await this.issue({
        subjectDid,
        credential,
      })) as TrustedListVerifableCredential;

      // 3.PersistenceServiceを用いてデータを保存する。
      const cid = await this.persistenceService.putVC(signedCredential);
      // 3.Registryに登録
      await this.persistenceService.putRegistryValue(
        subjectDid,
        cid.toString(),
      );
      return { cid: cid.toString(), validUntil };
    } catch (error) {
      this.logger.error('Error in updateExecute:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof PersistenceServiceError) {
        throw new HttpException(
          {
            code: 'PERSISTENCE_SERVICE_FAILD',
            message: 'data access field',
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
  async deleteExecute(subjectDid: string): Promise<any> {
    try {
      //1.didのバリデーション
      this.validateDid(subjectDid);
      //2.登録済みの確認(未登録の場合は例外をスロー)
      await this.persistenceService.isExists(subjectDid, true);
      //3. RegistryからsubjectDidを削除
      await this.persistenceService.removeRegistryValue(subjectDid);
      return { subjectDid };
    } catch (error) {
      this.logger.error('Error in deleteExecute:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof PersistenceServiceError) {
        throw new HttpException(
          {
            code: 'PERSISTENCE_SERVICE_FAILD',
            message: 'data access field',
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
  async verifyExecute(subjectDid: string): Promise<{
    subjectDid: string;
    status: string;
    validUntil: string;
    cid: string;
  }> {
    try {
      //1.didのバリデーション
      this.validateDid(subjectDid);

      //2.登録済みの確認(未登録の場合は例外をスロー)
      const { credential, cid } = await this.read(subjectDid);

      //2.署名検証と、subjectDidのチェック
      await this.verifyProofAndId(subjectDid, credential);

      //3.credentialSubjectの検証
      const { validUntil, status } =
        await this.verifyCredentialSubject(credential);

      return { subjectDid, status, validUntil, cid };
    } catch (error) {
      this.logger.error('Error in verifyExecute:', error);
      if (error instanceof HttpException) {
        throw error;
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

  async listQueryExecute(): Promise<ListData[]> {
    try {
      const list: ListData[] = [];

      //1.紐づけ情報全件取得
      const cache = await this.persistenceService.getRegistryCache();
      for (const reg of cache) {
        const { linkKey, cid } = reg as RegistryTableSchema;
        //1.ファイル読み込む
        const { credential } = await this.read(linkKey);
        //2.署名検証と、subjectDidのチェック
        await this.verifyProofAndId(linkKey, credential);
        //3.credentialSubjectの検証
        const { validUntil, status } =
          await this.verifyCredentialSubject(credential);
        const payload = {
          trustedIssuer: linkKey,
          status: status,
          validUntil: validUntil,
          metadata: {
            verifableCredentialUrl: this.ipfsGatewayUrl,
            fetchedCid: cid,
          },
        };
        list.push(payload);
      }
      return { ...list };
    } catch (error) {
      this.logger.error('Error in listQueryExecute:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof PersistenceServiceError) {
        throw new HttpException(
          {
            code: 'PERSISTENCE_SERVICE_FAILD',
            message: 'data access faild',
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

  private async read(subjectDid: string): Promise<{
    credential: TrustedListVerifableCredential;
    cid: string;
  }> {
    try {
      // 1. データの存在をチェックする(存在しない場合は例外スロー)
      await this.persistenceService.isExists(subjectDid, true);
      // 2. RegistryからCIDをデータを取得
      const { cid } =
        await this.persistenceService.getRegistryValue(subjectDid);
      // 3.PersistenceServiceを用いてデータを保存する。
      const credential = (await this.persistenceService.getVC(
        cid,
      )) as TrustedListVerifableCredential;
      return { credential, cid };
    } catch (error) {
      this.logger.error('Error in read:', error);
      if (error instanceof HttpException) {
        throw new HttpException(
          {
            code: 'TRUSTED_LIST_IPFS_READ_FAILD',
            message: 'data access faild',
            generalErrors: error.getResponse(),
          },
          error.getStatus(),
        );
      }
      if (error instanceof PersistenceServiceError) {
        throw new HttpException(
          {
            code: 'PERSISTENCE_SERVICE_FAILD',
            message: 'data access faild',
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
  private async verifyProofAndId(
    subjectDid: string,
    credential: TrustedListVerifableCredential,
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
      if (subjectDid !== credential?.credentialSubject.id) {
        errors.push({
          status: ERROR_MESSAGES.UNKNOWN,
          message: `List id does not match: Req(${subjectDid}) Res(${credential?.credentialSubject.id})`,
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
  private validateDid(subjectDid: string): boolean {
    const errors: GeneralErrorDetails[] = [];
    try {
      if (!validateDid(subjectDid)) {
        errors.push({
          message: ERROR_MESSAGES.VALIDATION_DID_ERROR,
        });
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
      return true;
    } catch (error) {
      this.logger.error('Error in validateDid:', error);
      if (error instanceof HttpException) {
        throw new HttpException(
          {
            code: 'TRUSTED_LIST_SUBJECT_DID_VALIDATION_FAILD',
            message: 'subjectDid validation faild',
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
  private async verifyCredentialSubject(
    credential: TrustedListVerifableCredential,
  ): Promise<{
    validUntil: string;
    status: string;
  }> {
    const errors: GeneralErrorDetails[] = [];
    try {
      const entry: TrustedIssuerEntry =
        credential.credentialSubject?.trustedIssuerEntry;
      if (!entry) {
        errors.push({
          status: TRUSTED_CODE.NOT_TRUSTED,
          message: 'trustedIssuerEntry is not found.',
        });
      }
      if (!entry.validUntil || typeof entry.validUntil !== 'string') {
        this.logger.warn(`Entry missing or invalid validUntil:`, entry);
        errors.push({
          status: TRUSTED_CODE.NOT_TRUSTED,
          message: 'Entry missing or invalid validUntil: ${entry}',
        });
      }
      try {
        const validUntilDate = new Date(entry.validUntil);
        if (isNaN(validUntilDate.getTime())) {
          this.logger.warn(
            `Entry has unparsable validUntil date string: ${entry.validUntil}`,
            entry,
          );
          errors.push({
            status: TRUSTED_CODE.NOT_TRUSTED,
            message: `Entry has unparsable validUntil date string: ${entry.validUntil}`,
          });
        }
        const isFuture = isAfterDay(validUntilDate);
        if (!isFuture) {
          errors.push({
            status: TRUSTED_CODE.NOT_TRUSTED,
            message: `Validity period has expired: ${entry.validUntil}`,
          });
        }
      } catch (parseError) {
        console.error(
          `Error parsing validUntil date string: ${entry.validUntil}`,
          parseError,
          entry,
        );
        errors.push({
          status: TRUSTED_CODE.NOT_TRUSTED,
          message: `Error parsing validUntil date string: ${entry.validUntil}`,
        });
      }
      if (errors.length) {
        throw new HttpException(
          { code: CODE_MESSAGES.VC_VERIFICATIN_FIELD, errors },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      return {
        validUntil: entry.validUntil,
        status: TRUSTED_CODE.TRUSTED,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error in verifyCredentialSubject:', error);
      throw new HttpException(
        {
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  private async issue(options: {
    subjectDid: string;
    credential?: TrustedListVerifableCredential;
  }): Promise<TrustedListVerifableCredential> {
    try {
      if (options.credential) {
        const signedVC = await updateCredentialSigned(
          options.credential,
          this.keyFileLoader,
          this.documentLoader,
        );
        return signedVC;
      } else {
        const signedVC = await newCredentialSined(
          this.issuerDid,
          options.subjectDid,
          this.licenseExpiration,
          this.keyFileLoader,
          this.documentLoader,
        );
        return signedVC;
      }
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
  private validateValidUnit(validUntil?: string): boolean {
    const errors: GeneralErrorDetails[] = [];
    if (!validUntil) {
      return true;
    } else {
      try {
        const validUntilDate = new Date(validUntil);
        if (isNaN(validUntilDate.getTime())) {
          this.logger.warn(
            `Unparsable validUnit date string in requst body: ${validUntil}`,
          );
          errors.push({
            message: `Unparsable validUnit date string in requst body.`,
          });
          throw new HttpException(errors, HttpStatus.BAD_REQUEST);
        }
        return true;
      } catch (parseError) {
        if (parseError instanceof HttpException) {
          this.logger.error('Error in validateValidUnit:', parseError);
          throw new HttpException(
            {
              code: 'TRASTED_LIST_VALIDUNTIL_VALIDATE_FAILD',
              message: 'Trasted issuer validUntil validatefaild',
              generalErrors: parseError.getResponse(),
            },
            parseError.getStatus(),
          );
        }
        throw new HttpException(
          {
            code: 'TRASTED_LIST_VALIDUNTIL_VALIDATE_FAILD',
            message: 'Trasted issuer validUntil validatefaild',
            generalErrors: parseError.getResponse(),
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }
}
