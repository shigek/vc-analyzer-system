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
  createSignedTrustedListCredential,
  updateSignedTrustedListCredential,
} from '../utils/signed-trusted-list-vc';
import { securityLoader } from '@digitalbazaar/security-document-loader';
import { SubjectDidUpdateDto } from '../dto/subject-did-update';
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
} from '@share/share/common/message/error-message';

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
    const url5 = this.configService.get<string>('TRUSTED_SERVICE_PROVIDER_DID');
    if (!url5) {
      throw new Error(
        ENVIRONMENT_MESSAGES.RESOURCE_NOT_FOUND('TRUSTED_SERVICE_PROVIDER_DID'),
      );
    }
    this.trustedServiceProviderDid = url5;

    const loader = securityLoader();
    loader.addDocuments({ documents: [...trastedListContexts] });
    this.documentLoader = loader.build();
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

  async getTrustedListAndFilter(subjectDid: string): Promise<any> {
    const errors: VerificationErrorDetails[] = [];
    const resurceArgs: ResourceArgs = {
      resourceType: RESOURCE_TYPE.TRUSTED_ISSUER,
      identifier: subjectDid,
    };
    try {
      if (!validateDid(subjectDid)) {
        errors.push({
          status: ERROR_MESSAGES.INVALID_ISSUER_STATUS,
          message: ERROR_MESSAGES.VALIDATION_DID_ERROR,
        });
        throw new HttpException(
          { code: CODE_MESSAGES.VC_VERIFICATIN_FIELD, errors },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      const currentTrustedListCid = this.registryMap.get(subjectDid);
      if (!currentTrustedListCid) {
        errors.push({
          status: ERROR_MESSAGES.INVALID_ISSUER_STATUS,
          message: ERROR_MESSAGES.RESOURCE_NOT_FOUND(resurceArgs),
        });
        throw new HttpException(
          { code: CODE_MESSAGES.VC_VERIFICATIN_FIELD, errors },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      const trustedListData = (await this.ipfsAccessor.fetchJsonFromIpfs(
        currentTrustedListCid!,
      )) as TrustedListVerifableCredential;
      const isValidSignature = await verifySignature(
        trustedListData,
        this.documentLoader,
      );
      if (!isValidSignature) {
        errors.push({
          status: ERROR_MESSAGES.INVALID_ISSUER_STATUS,
          message: 'Invalid trusted issuer signature.',
        });
      }
      if (subjectDid !== trustedListData?.credentialSubject.id) {
        errors.push({
          status: ERROR_MESSAGES.INVALID_ISSUER_STATUS,
          message: 'The subject DID does not match.',
        });
      }
      const entry: TrustedIssuerEntry =
        trustedListData.credentialSubject?.trustedIssuerEntry;
      if (!entry) {
        errors.push({
          status: ERROR_MESSAGES.INVALID_ISSUER_STATUS,
          message: 'trustedIssuerEntry is not found.',
        });
      }
      if (!entry.validUntil || typeof entry.validUntil !== 'string') {
        this.logger.warn(`Entry missing or invalid validUntil:`, entry);
        errors.push({
          status: ERROR_MESSAGES.INVALID_ISSUER_STATUS,
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
            status: ERROR_MESSAGES.INVALID_ISSUER_STATUS,
            message: `Entry has unparsable validUntil date string: ${entry.validUntil}`,
          });
        }
        const isFuture = isAfterDay(validUntilDate);
        if (!isFuture) {
          errors.push({
            status: ERROR_MESSAGES.INVALID_ISSUER_STATUS,
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
          status: ERROR_MESSAGES.INVALID_ISSUER_STATUS,
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
        trustedIssuer: {
          trustedIssuerDid: trustedListData?.credentialSubject.id,
          validUntil: entry.validUntil,
        },
        status: ERROR_MESSAGES.VALID_ISSUER_STATUS,
        statusCode: 200,
        fetchedCid: currentTrustedListCid,
      };
    } catch (error) {
      this.logger.error('Error in getTrustedListAndFilter:', error);
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

  async registrationTrustedList(subjectDid: string): Promise<any> {
    const errors: RegistrationErrorDetails[] = [];
    try {
      if (!validateDid(subjectDid)) {
        errors.push({
          message: `Invalid subject DID format in URL.`,
        });
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
      const currentTrustedListCid = this.registryMap.get(subjectDid);
      if (currentTrustedListCid) {
        errors.push({
          message: `Trusted issuer with DID ${subjectDid} already exists in registory.`,
        });
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
      const trustedListData = await createSignedTrustedListCredential(
        this.trustedServiceProviderDid,
        subjectDid,
        this.registrationLicenseExpiration,
        this.documentLoader,
      );
      const cid = await this.ipfsAccessor.addJsonToIpfs(trustedListData);
      this.registryMap.set(subjectDid, cid.toString());
      await saveRegistry(this.registryMap, this.registryFilePath);
      return {
        trustedIssuer: {
          trustedIssuerDid: trustedListData?.credentialSubject.id,
          validUntil:
            trustedListData.credentialSubject?.trustedIssuerEntry.validUntil,
        },
        statusCode: 201,
        fetchedCid: cid.toString(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw new HttpException(
          {
            code: 'TRUSTED_LIST_REGISTRATION_FAILD',
            message: 'Trasted issuer data registration faild',
            registrationErrors: error.getResponse(),
          },
          error.getStatus(),
        );
      }
      this.logger.error('Error in registrationTrustedList:', error);
      throw new HttpException(
        {
          message: `An unexpected error occurred. prease contact support.`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async updateTrustedList(
    subjectDid: string,
    subjectDidUpdateDto: SubjectDidUpdateDto,
  ): Promise<any> {
    const errors: RegistrationErrorDetails[] = [];
    try {
      if (subjectDidUpdateDto.validUntil) {
        try {
          const validUntilDate = new Date(subjectDidUpdateDto.validUntil);
          if (isNaN(validUntilDate.getTime())) {
            this.logger.warn(
              `Unparsable validUnit date string in requst body: ${subjectDidUpdateDto.validUntil}`,
              subjectDidUpdateDto,
            );
            errors.push({
              message: `Unparsable validUnit date string in requst body.`,
            });
            throw new HttpException(errors, HttpStatus.BAD_REQUEST);
          }
        } catch (parseError) {
          console.error(
            `Unparsable validUnit date string in requst body: ${subjectDidUpdateDto.validUntil}`,
            parseError,
            subjectDidUpdateDto,
          );
          errors.push({
            message: `Unparsable validUnit date string in requst body.`,
          });
          throw new HttpException(errors, HttpStatus.BAD_REQUEST);
        }
      }
      if (!validateDid(subjectDid)) {
        errors.push({
          message: `Invalid subject DID format in URL.`,
        });
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
      let currentTrustedListCid = this.registryMap.get(subjectDid);
      if (!currentTrustedListCid) {
        errors.push({
          message: `Trusted issuer with DID ${subjectDid} not found in registory`,
        });
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
      const trustedListData = (await this.ipfsAccessor.fetchJsonFromIpfs(
        currentTrustedListCid,
      )) as TrustedListVerifableCredential;
      const isValidSignature = await verifySignature(
        trustedListData,
        this.documentLoader,
      );
      if (!isValidSignature) {
        errors.push({
          message: 'Invalid current trusted issuer data signature.',
        });
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
      const updateTrustedListData = await updateSignedTrustedListCredential(
        this.trustedServiceProviderDid,
        subjectDid,
        subjectDidUpdateDto,
        trustedListData,
        this.documentLoader,
      );
      const cid = await this.ipfsAccessor.addJsonToIpfs(updateTrustedListData);
      this.registryMap.set(subjectDid, cid.toString());
      await saveRegistry(this.registryMap, this.registryFilePath);
      return {
        trustedIssuer: {
          trustedIssuerDid: trustedListData?.credentialSubject.id,
          validUntil:
            trustedListData.credentialSubject?.trustedIssuerEntry.validUntil,
        },
        statusCode: 200,
        fetchedCid: cid.toString(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw new HttpException(
          {
            code: 'TRASTED_LIST_UPDATE_FAILD',
            message: 'Trasted issuer data update faild',
            registrationErrors: error.getResponse(),
          },
          error.getStatus(),
        );
      }
      this.logger.error('Error in updateTrustedList:', error);
      throw new HttpException(
        {
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  async deleteTrustedList(subjectDid: string): Promise<any> {
    const errors: RegistrationErrorDetails[] = [];
    try {
      if (!validateDid(subjectDid)) {
        errors.push({
          message: `Invalid subject DID format in URL.`,
        });
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
      const currentTrustedListCid = this.registryMap.get(subjectDid);
      if (!currentTrustedListCid) {
        errors.push({
          message: `Trusted issuer with DID ${subjectDid}　data not found in registry`,
        });
        throw new HttpException(errors, HttpStatus.BAD_REQUEST);
      }
      // レジストリの更新と書き込み
      this.registryMap.delete(subjectDid);
      await saveRegistry(this.registryMap, this.registryFilePath);
      return {
        trustedIssuer: {
          trustedIssuerDid: subjectDid,
        },
        statusCode: 200,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw new HttpException(
          {
            code: 'TRASTED_LIST_DELETE_FAILD',
            message: 'Trasted issuer data delete faild',
            registrationErrors: error.getResponse(),
          },
          error.getStatus(),
        );
      }
      this.logger.error('Error in deleteTrustedList:', error);
      throw new HttpException(
        {
          message: ERROR_MESSAGES.INTERNAL_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
