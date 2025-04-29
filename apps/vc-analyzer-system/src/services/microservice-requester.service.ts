import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateDao, ShareService, UpdateDao } from '@share/share';
import axios from 'axios';

@Injectable()
export class MicroserviceRequesterService {
  private readonly didResolverUrl: string;
  private readonly statusListUrl: string;
  private readonly trustedListUrl: string;
  constructor(
    private configService: ConfigService,
    private shareService: ShareService,
  ) {
    const url0 = this.configService.get<string>('DID_RESOLVER_URL');
    if (!url0) {
      throw new Error('DID_RESOLVER_URL environment variable is not set.');
    }
    this.didResolverUrl = url0;

    const url1 = this.configService.get<string>('STATUS_LIST_URL');
    if (!url1) {
      throw new Error('STATUS_LIST_URL environment variable is not set.');
    }
    this.statusListUrl = url1;

    const url2 = this.configService.get<string>('TRUSTED_LIST_URL');
    if (!url2) {
      throw new Error('TRUSTED_LIST_URL environment variable is not set.');
    }
    this.trustedListUrl = url2;
  }
  async getDidDocument(did: string, correlationId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.didResolverUrl}/resolve/${did}`,
        {
          headers: {
            'X-Correlation-ID': correlationId,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      throw this.shareService.errorResponse(
        error,
        'DID Resolver',
        correlationId,
        [did, ''],
      );
    }
  }
  async getStatus(
    listId: string,
    index: number,
    correlationId: string,
  ): Promise<any> {
    try {
      const response = await axios.get(
        `${this.statusListUrl}/status-checks/${listId}/${index}`,
        {
          headers: {
            'X-Correlation-ID': correlationId,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      throw this.shareService.errorResponse(
        error,
        'Status List',
        correlationId,
        [listId, `${index}`],
      );
    }
  }
  async isTrustedIssuer(did: string, correlationId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.trustedListUrl}/trusted-issuers/${did}`,
        {
          headers: {
            'X-Correlation-ID': correlationId,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      throw this.shareService.errorResponse(
        error,
        'Trusted List',
        correlationId,
        [did, ``],
      );
    }
  }
  async createStatusList(
    createDao: CreateDao,
    correlationId: string,
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.statusListUrl}/status-lists/register`,
        {
          listId: createDao.listId,
          index: createDao.index,
          status: createDao.status,
        },
        {
          headers: {
            'X-Correlation-ID': correlationId,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      throw this.shareService.errorResponse(
        error,
        'Status List',
        correlationId,
        [``, ``],
      );
    }
  }
  async updateStatus(
    listId: string,
    index: number,
    updateDao: UpdateDao,
    correlationId: string,
  ): Promise<any> {
    try {
      const response = await axios.put(
        `${this.statusListUrl}/status-lists/${listId}/entries/${index}/status`,
        {
          status: updateDao.status,
        },
        {
          headers: {
            'X-Correlation-ID': correlationId,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      throw this.shareService.errorResponse(
        error,
        'Status List',
        correlationId,
        [``, ``],
      );
    }
  }
}
