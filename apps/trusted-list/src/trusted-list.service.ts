import {
  Injectable,
  OnApplicationBootstrap,
  Logger,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import path from 'path';
import {
  isAfterDay,
  ResponseDao,
  saveRegistry,
  loadRegistry,
} from '@share/share';
import { IpfsAccessor } from '@share/share/utils/ipfs-data-accessor';
import { verifyTrustedListSignature } from './utils/vc-verifier';
import { createSignedTrustedListCredential } from './utils/create-signed-trusted-list-vc';
import { securityLoader } from '@digitalbazaar/security-document-loader';
import {
  TrustedIssuerEntry,
  TrustedListDocument,
} from './interfaces/trusted-vc-data.interface';
import { trastedListContext } from './context/trusted-list-context';

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
  private responseDao: ResponseDao = {
    serviceMetaData: {},
  };

  constructor(private configService: ConfigService) {
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
      'trusted-list-registry.json',
    );
    const url4 = this.configService.get<string>(
      'REGISTRATION_LICENSE_EXPIRATION',
    );
    if (!url4) {
      throw new Error(
        'REGISTRATION_LICENSE_EXPIRATION environment variable is not set.',
      );
    }
    this.registrationLicenseExpiration = parseInt(url4);
    const url5 = this.configService.get<string>('TRUSTED_SERVICE_PROVIDER_DID');
    if (!url5) {
      throw new Error(
        'TRUSTED_SERVICE_PROVIDER_DID environment variable is not set.',
      );
    }
    this.trustedServiceProviderDid = url5;

    const loader = securityLoader();
    //loader.addDocuments({ documents: [...trastedListContext] });
    this.documentLoader = securityLoader().build();
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

  getCurrentTrustedCid(subjectDid: string): any {
    const currentTrustedListCid = this.registryMap.get(subjectDid);
    return currentTrustedListCid;
  }

  async getTrustedListAndFilter(
    subjectDid: string,
    correlationId: string,
  ): Promise<any> {
    let currentTrustedListCid = this.registryMap.get(subjectDid);
    try {
      if (!currentTrustedListCid) {
        this.responseDao.serviceMetaData['detail'] = 'Tristed Data not found.';
        throw new HttpException(
          {
            status: 'unknown',
          },
          404,
        );
      }
      const trustedListData = (await this.ipfsAccessor.fetchJsonFromIpfs(
        currentTrustedListCid,
      )) as TrustedListDocument;
      const isValidSignature = await verifyTrustedListSignature(
        trustedListData,
        this.documentLoader,
      );
      if (!isValidSignature) {
        throw new HttpException(
          {
            status: 'not-trusted',
            message: 'Invalid Trusted List signature.',
            fetchedCid: currentTrustedListCid,
          },
          451,
        );
      }
      if (subjectDid !== trustedListData?.credentialSubject.id) {
        throw new HttpException(
          {
            status: 'not-trusted',
            message: 'The subject DID does not match.',
            fetchedCid: currentTrustedListCid,
          },
          451,
        );
      }
      this.logger.log('Signature is valid. Proceeding to filter.');
      const entry: TrustedIssuerEntry =
        trustedListData.credentialSubject?.trustedIssuerEntries[0] || undefined;
      if (!entry) {
        throw new HttpException(
          {
            status: 'not-trusted',
            message: 'TrustedIssuerEntry is not found.',
            fetchedCid: currentTrustedListCid,
          },
          451,
        );
      }
      if (!entry.validUntil || typeof entry.validUntil !== 'string') {
        this.logger.warn(`Entry missing or invalid validUntil:`, entry);
        throw new HttpException(
          {
            status: 'not-trusted',
            message: 'Entry missing or invalid validUntil: ${entry}',
            fetchedCid: currentTrustedListCid,
          },
          451,
        );
      }
      try {
        const validUntilDate = new Date(entry.validUntil);
        if (isNaN(validUntilDate.getTime())) {
          this.logger.warn(
            `Entry has unparsable validUntil date string: ${entry.validUntil}`,
            entry,
          );
          throw new HttpException(
            {
              status: 'not-trusted',
              message: `Entry has unparsable validUntil date string: ${entry.validUntil}`,
              fetchedCid: currentTrustedListCid,
            },
            451,
          );
        }
        const isFuture = isAfterDay(validUntilDate);
        if (!isFuture) {
          throw new HttpException(
            {
              status: 'not-trusted',
              message: `Validity period has expired: ${entry.validUntil}`,
              fetchedCid: currentTrustedListCid,
            },
            451,
          );
        }
      } catch (parseError) {
        console.error(
          `Error parsing validUntil date string: ${entry.validUntil}`,
          parseError,
          entry,
        );
        throw new HttpException(
          {
            status: 'not-trusted',
            message: `Error parsing validUntil date string: ${entry.validUntil}`,
            fetchedCid: currentTrustedListCid,
          },
          451,
        );
      }
      return {
        trustedIssuer: {
          trustedIssuerDid: trustedListData?.credentialSubject.id,
          validUntil: entry.validUntil,
        },
        status: 'trusted',
        statusCode: 200,
        fetchedCid: currentTrustedListCid,
      };
    } catch (error) {
      this.logger.error('Error in getTrustedListAndFilter:', error);
      throw new HttpException(
        {
          status: 'unknown',
          message: `An unexpected error occurred. prease contact support.`,
        },
        500,
      );
    }
  }
}
