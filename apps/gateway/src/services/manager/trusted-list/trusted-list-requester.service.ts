import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ShareService } from '@share/share';
import axios from 'axios';

@Injectable()
export class TrustedListsRequesterService {
  private readonly trustedListUrl: string;
  constructor(
    private configService: ConfigService,
    private shareService: ShareService,
  ) {
    const url = this.configService.get<string>('TRUSTED_LIST_URL');
    if (!url) {
      throw new Error('TRUSTED_LIST_URL environment variable is not set.');
    }
    this.trustedListUrl = url;
  }
  async addTrustedList(
    createDao: any,
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
  async updateTrustedList(
    subjectDid: string,
    createDao: any,
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
  async deleteTrustedList(
    subjectDid: string,
    createDao: any,
    correlationId: string,
  ): Promise<any> {
    try {
      const response = await axios.delete(
        `${this.trustedListUrl}/trasted-issuers/${subjectDid}`,
        {
          headers: {
            'X-Correlation-ID': correlationId,
            'Content-Type': 'application/json',
          },
          data: createDao,
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
