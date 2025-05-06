import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ShareService } from '@share/share';
import axios from 'axios';

@Injectable()
export class StatusListsRequesterService {
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
  async addStatusList(createDao: any, correlationId: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.statusListUrl}/status-lists/register`,
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
  async updateStatusList(
    listId: string,
    index: number,
    updateDao: any,
    correlationId: string,
  ): Promise<any> {
    try {
      const response = await axios.put(
        `${this.statusListUrl}/status-lists/${listId}/entries/${index}/status`,
        updateDao,
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
