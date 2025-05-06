import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getAxionResponse } from '@share/share/common/axios/error-handler.axios';
import { ERROR_MESSAGES } from '@share/share/common/message/error-message';
import axios from 'axios';

@Injectable()
export class VerifiersRequesterService {
  private readonly didResolverUrl: string;
  private readonly statusListUrl: string;
  private readonly trustedListUrl: string;
  private readonly logger = new Logger(VerifiersRequesterService.name);
  constructor(
    private configService: ConfigService,
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
      this.logger.error(ERROR_MESSAGES.EXTERNAL_API_CALL_FAILD);
      throw getAxionResponse(
        error,
        'DID Resolver',
        [did],
        correlationId,
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
      this.logger.error(ERROR_MESSAGES.EXTERNAL_API_CALL_FAILD);
      throw getAxionResponse(
        error,
        'Status List',
        [listId, `${index}`],
        correlationId,
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
      this.logger.error(ERROR_MESSAGES.EXTERNAL_API_CALL_FAILD);
      throw getAxionResponse(
        error,
        'Trusted List',
        [did],
        correlationId,
      );
    }
  }
}
