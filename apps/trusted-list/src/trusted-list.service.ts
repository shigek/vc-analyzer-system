import {
  Injectable,
  OnApplicationBootstrap,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { loadRegistry } from './utils/registry-file-handler';
import path from 'path';
import { isAfterDay, ResponseDao } from '@share/share';
import { IpfsAccessor } from '@share/share/utils/ipfs-data-accessor';
import { DocumentLoader } from '@share/share/did/document-loader';
import { verifyTrustedListSignature } from './utils/vc-verifier';
import { createSignedTrustedListCredential } from './utils/create-signed-trusted-list-vc';
import {
  TrustedIssuerEntry,
  TrustedListDocument,
} from './interfaces/trusted-vc-data.interface';

@Injectable()
export class TrustedListService implements OnApplicationBootstrap {
  private ipfsAccessor: IpfsAccessor;
  private registryMap: Map<string, string>;
  private readonly ipfsPeerUrl: string;
  private readonly registrationLicenseExpiration: number;
  private readonly trustedServiceProviderDid: string;
  private readonly logger = new Logger(TrustedListService.name);
  private registryFilePath: string;
  private documentLoader: DocumentLoader;
  private responseDao: ResponseDao = {
    serviceMetaData: {},
  };

  constructor(
    private configService: ConfigService,
    @Inject('DOCUMENT_LOADER') documentLoader: DocumentLoader,
  ) {
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
    this.documentLoader = documentLoader;
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

  async getTrustedListAndFilter(
    subjectDid: string,
    correlationId: string,
  ): Promise<any> {
    const currentTrustedListCid = this.registryMap.get(subjectDid);
    let trustedListData: TrustedListDocument;
    try {
      createSignedTrustedListCredential(
        this.trustedServiceProviderDid,
        subjectDid,
        this.registrationLicenseExpiration,
      );
      if (!currentTrustedListCid) {
        this.responseDao.serviceMetaData['detail'] = 'Tristed Data not found.';
        return { ...this.responseDao, status: 'unknown' };
      }
      trustedListData = (await this.ipfsAccessor.fetchJsonFromIpfs(
        currentTrustedListCid,
      )) as TrustedListDocument;
      const isSignatureValid =
        await verifyTrustedListSignature(trustedListData);
      if (!isSignatureValid) {
        this.responseDao.serviceMetaData['detail'] =
          'Signature is valid. Proceeding to filter.';
        return { ...this.responseDao, status: 'not-trusted' };
      }

      if (subjectDid !== trustedListData?.credentialSubject.id) {
        this.responseDao.serviceMetaData['detail'] =
          'The subject DID does not match.';
        return { ...this.responseDao, status: 'not-trusted' };
      }

      const allEntries: TrustedIssuerEntry[] =
        trustedListData.credentialSubject?.trustedIssuerEntries || [];
      if (!Array.isArray(allEntries)) {
        console.error(
          'trustedIssuerEntries is not an array in the fetched data.',
        );
        this.responseDao.serviceMetaData['detail'] =
          'trustedIssuerEntries is not an array in the fetched data.';
        return { ...this.responseDao, status: 'unknown' };
      }
      const validEntries = allEntries.filter((entry) => {
        if (!entry.validUntil || typeof entry.validUntil !== 'string') {
          this.logger.warn(`Entry missing or invalid validUntil:`, entry);
          this.responseDao.serviceMetaData['detail'] =
            `Entry missing or invalid validUntil: ${entry}`;
          return false;
        }
        try {
          const validUntilDate = new Date(entry.validUntil);
          if (isNaN(validUntilDate.getTime())) {
            console.warn(
              `Entry has unparsable validUntil date string: ${entry.validUntil}`,
              entry,
            );
            return false;
          }
          const isFuture = isAfterDay(validUntilDate);
          return isFuture;
        } catch (parseError) {
          console.error(
            `Error parsing validUntil date string: ${entry.validUntil}`,
            parseError,
            entry,
          );
          this.responseDao.serviceMetaData['detail'] =
            `Error parsing validUntil date string: ${entry.validUntil}`;
          return false;
        }
      });
      this.logger.log(`Filtered down to ${validEntries.length} valid entries.`);
      return { ...this.responseDao, status: 'trusted' };
    } catch (error) {
      this.logger.error('Error in getTrustedListAndFilter:', error);
      return { ...this.responseDao, status: 'unknown', error: error.message };
    }
  }
}
