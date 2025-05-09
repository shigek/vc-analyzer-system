import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getAxionResponse } from '@share/share/common/axios/error-handler.axios';
import { ERROR_MESSAGES } from '@share/share/common/message/common-message';
import axios from 'axios';

@Injectable()
export class TrustedListsRequesterService {
  private readonly trustedListUrl: string;
  private readonly logger = new Logger(TrustedListsRequesterService.name);
  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('TRUSTED_LIST_URL');
    if (!url) {
      throw new Error('TRUSTED_LIST_URL environment variable is not set.');
    }
    this.trustedListUrl = url;
  }
  async addTrustedList(
    createDao: any,
    accessToken: string,
    correlationId: string,
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.trustedListUrl}/trusted-issuers`,
        createDao,
        {
          headers: {
            'X-Correlation-ID': correlationId,
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error(ERROR_MESSAGES.EXTERNAL_API_CALL_FAILD);
      throw getAxionResponse(error, 'Trusted list', [], correlationId);
    }
  }
  async updateTrustedList(
    subjectDid: string,
    createDao: any,
    accessToken: string,
    correlationId: string,
  ): Promise<any> {
    try {
      const response = await axios.put(
        `${this.trustedListUrl}/trasted-issuers/${subjectDid}`,
        createDao,
        {
          headers: {
            'X-Correlation-ID': correlationId,
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error(ERROR_MESSAGES.EXTERNAL_API_CALL_FAILD);
      throw getAxionResponse(
        error,
        'Trusted list',
        [subjectDid],
        correlationId,
      );
    }
  }
  async deleteTrustedList(
    subjectDid: string,
    createDao: any,
    accessToken: string,
    correlationId: string,
  ): Promise<any> {
    try {
      const response = await axios.delete(
        `${this.trustedListUrl}/trasted-issuers/${subjectDid}`,
        {
          headers: {
            'X-Correlation-ID': correlationId,
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          data: createDao,
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error(ERROR_MESSAGES.EXTERNAL_API_CALL_FAILD);
      throw getAxionResponse(
        error,
        'Trusted list',
        [subjectDid],
        correlationId,
      );
    }
  }
}
