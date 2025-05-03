import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ShareService } from '@share/share';
import axios from 'axios';

@Injectable()
export class IssuersRequesterService {
  private readonly statusListUrl: string;
  constructor(
    private configService: ConfigService,
    private shareService: ShareService,
  ) {
    const url = this.configService.get<string>('STATUS_LIST_URL');
    if (!url) {
      throw new Error('STATUS_LIST_URL environment variable is not set.');
    }
    this.statusListUrl = url;
  }
  async createStatusList(createDao: any, correlationId: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.statusListUrl}/status-lists/register`,
        {
          credentials: createDao.credentials,
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
    updateDao: any,
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
  async createTrustedList(createDao: any, correlationId: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.statusListUrl}/status-lists/register`,
        {
          credentials: createDao.credentials,
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
