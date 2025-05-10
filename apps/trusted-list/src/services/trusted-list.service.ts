import {
  Injectable,
  OnApplicationBootstrap,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import path from 'path';
import {
  saveRegistry,
  loadRegistry,
  validateDid,
  isAfterDay,
} from '@share/share';
import { IpfsAccessor } from '@share/share/utils/ipfs-data-accessor';
import {
  newCredentialSined,
  setDocumentLoader,
  updateCredentialSigned,
} from '../utils/signed-trusted-list-vc';
import { verifySignature } from '@share/share/utils/jsonld-verifier';
import {
  TrustedIssuerEntry,
  TrustedListVerifableCredential,
} from '../interfaces/trusted-vc-data.interface';
import { contexts as trastedListContexts } from '../context';
import {
  VerificationErrorDetails,
  RegistrationErrorDetails,
} from '@share/share/interfaces/response/error-response.interface';
import {
  ERROR_MESSAGES,
  ENVIRONMENT_MESSAGES,
  ResourceArgs,
  CODE_MESSAGES,
  RESOURCE_TYPE,
  TRUSTED_CODE,
} from '@share/share/common/message/common-message';
import {
  fileLoader,
  KeyFileDataLoader,
} from '@share/share/common/key/provider.key';

@Injectable()
export class TrustedListService implements OnApplicationBootstrap {
  private ipfsAccessor: IpfsAccessor;
  private registryMap: Map<string, string>;
  private readonly ipfsPeerUrl: string;
  private readonly registrationLicenseExpiration: number;
  private readonly trustedServiceProviderDid: string;
  private readonly logger = new Logger(TrustedListService.name);
  private registryFilePath: string;
  private documentLoader: any;
  private readonly keyFileLoader: KeyFileDataLoader;

  constructor(private configService: ConfigService) {
    const url2 = this.configService.get<string>('IPFS_PEER_URL');
    if (!url2) {
      throw new Error(ENVIRONMENT_MESSAGES.RESOURCE_NOT_FOUND('IPFS_PEER_URL'));
    }
    this.ipfsPeerUrl = url2;
    const url3 = this.configService.get<string>('REGISTRY_DATA_PATH');
    if (!url3) {
      throw new Error(
        ENVIRONMENT_MESSAGES.RESOURCE_NOT_FOUND('REGISTRY_DATA_PATH'),
      );
    }
    this.registryFilePath = path.join(
      __dirname,
      url3,
      'data',
      'trusted-list-registry.json',
    );
    const url4 = this.configService.get<string>(
      'REGISTRATION_LICENSE_EXPIRATION',
    );
    if (!url4) {
      throw new Error(
        ENVIRONMENT_MESSAGES.RESOURCE_NOT_FOUND(
          'REGISTRATION_LICENSE_EXPIRATION',
        ),
      );
    }
    this.registrationLicenseExpiration = parseInt(url4);
    const url5 = this.configService.get<string>(
      'STATUSLIST_SERVICE_PROVIDER_KEY_DATA',
    );
    if (!url5) {
      throw new Error(
        ENVIRONMENT_MESSAGES.RESOURCE_NOT_FOUND(
          'STATUSLIST_SERVICE_PROVIDER_KEY_DATA',
        ),
      );
    }
    const { loader, key } = fileLoader(url5);
    this.trustedServiceProviderDid = key;
    this.keyFileLoader = loader;
    this.documentLoader = setDocumentLoader();
  }

  async onApplicationBootstrap() {
    this.logger.log('Application bootstrap completed. Initializing...');
    this.ipfsAccessor = new IpfsAccessor({ url: this.ipfsPeerUrl });
    this.logger.log('Application bootstrap completed. FinishFinish');
    await this.load();
  }
  private async load(): Promise<void> {
    try {
      this.registryMap = await loadRegistry(this.registryFilePath);
    } catch (error) {
      this.logger.error('Error loading registry on startup:', error);
    }
  }

  async registration(
    subjectDid: string,
    signedCredential: TrustedListVerifableCredential,
    modify: boolean,
  ): Promise<{ fetchedCid: string }> {
    const errors: RegistrationErrorDetails[] = [];
    try {
      // 1.登録済みの確認
      const currentTrustedListCid = this.registryMap.get(subjectDid);
      if (currentTrustedListCid && !modify) {
        errors.push({
          message: `Trusted issuer with DID ${subjectDid} already exists in registory.`,
        });
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
      // 2.IPFSへデータを登録する。
      const cid = await this.ipfsAccessor.addJsonToIpfs(signedCredential);

      // 3.Registryに登録
      this.registryMap.set(subjectDid, cid.toString());
      await saveRegistry(this.registryMap, this.registryFilePath);
      return { fetchedCid: cid.toString() };
    } catch (error) {
      this.logger.error('Error in registration:', error);
      if (error instanceof HttpException) {
        throw new HttpException(
          {
            code: 'TRUSTED_LIST_REGISTRATION',
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
  async readIpfsData(subjectDid: string): Promise<{
    credential: TrustedListVerifableCredential;
    currentTrustedListCid: string;
  }> {
    const errors: RegistrationErrorDetails[] = [];
    const resurceArgs: ResourceArgs = {
      resourceType: RESOURCE_TYPE.TRUSTED_ISSUER,
      identifier: subjectDid,
    };
    try {
      const currentTrustedListCid = this.registryMap.get(subjectDid);
      if (!currentTrustedListCid) {
        errors.push({
          message: ERROR_MESSAGES.RESOURCE_NOT_FOUND(resurceArgs),
        });
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
      const credential = (await this.ipfsAccessor.fetchJsonFromIpfs(
        currentTrustedListCid!,
      )) as TrustedListVerifableCredential;
      return { credential, currentTrustedListCid };
    } catch (error) {
      this.logger.error('Error in readIpfsData:', error);
      if (error instanceof HttpException) {
        throw new HttpException(
          {
            code: 'STATUS_LIST_IPFS_READ_FAILD',
            message: 'not found faild',
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
  isExistsRegistryOrThrow(subjectDid: string, exists: boolean): boolean {
    const errors: RegistrationErrorDetails[] = [];
    const resurceArgs: ResourceArgs = {
      resourceType: RESOURCE_TYPE.TRUSTED_ISSUER,
      identifier: subjectDid,
    };
    try {
      const currentTrustedListCid = this.registryMap.get(subjectDid);
      if (exists) {
        if (currentTrustedListCid) {
          errors.push({
            message: `Status list with List ID ${subjectDid} already exists in registory.`,
          });
          throw new HttpException(errors, HttpStatus.BAD_REQUEST);
        } else {
          return true;
        }
      } else {
        if (!currentTrustedListCid) {
          errors.push({
            message: ERROR_MESSAGES.RESOURCE_NOT_FOUND(resurceArgs),
          });
          throw new HttpException(errors, HttpStatus.BAD_REQUEST);
        } else {
          return true;
        }
      }
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
      this.logger.error('Error in isExistsRegistryOrThrow:', error);
      throw new HttpException(
        {
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifyProofAndId(
    subjectDid: string,
    credential: TrustedListVerifableCredential,
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

  validateDid(subjectDid: string): boolean {
    const errors: RegistrationErrorDetails[] = [];
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

  async verifyCredentialSubject(
    credential: TrustedListVerifableCredential,
  ): Promise<{
    validUntil: string;
    status: string;
  }> {
    const errors: VerificationErrorDetails[] = [];
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
  async issue(options: {
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
          this.trustedServiceProviderDid,
          options.subjectDid,
          this.registrationLicenseExpiration,
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
  validateValidUnit(validUntil?: string): boolean {
    const errors: RegistrationErrorDetails[] = [];
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
              registrationErrors: parseError.getResponse(),
            },
            parseError.getStatus(),
          );
        }
        throw new HttpException(
          {
            code: 'TRASTED_LIST_VALIDUNTIL_VALIDATE_FAILD',
            message: 'Trasted issuer validUntil validatefaild',
            registrationErrors: parseError.getResponse(),
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }
  async deleteRegistry(subjectDid: string): Promise<any> {
    try {
      // レジストリの更新と書き込み
      this.registryMap.delete(subjectDid);
      await saveRegistry(this.registryMap, this.registryFilePath);
      return { subjectDid };
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
}
