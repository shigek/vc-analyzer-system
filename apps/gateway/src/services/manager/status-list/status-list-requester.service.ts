import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getAxionResponse } from '@share/share/common/axios/error-handler.axios';
import { ERROR_MESSAGES } from '@share/share/common/message/common-message';
import axios from 'axios';

@Injectable()
export class StatusListsRequesterService {
  private readonly statusListUrl: string;
  private readonly logger = new Logger(StatusListsRequesterService.name);
  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('STATUS_LIST_URL');
    if (!url) {
      throw new Error('STATUS_LIST_URL environment variable is not set.');
    }
    this.statusListUrl = url;
  }
  async addStatusList(
    createDao: any,
    accessToken: string,
    correlationId: string,
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.statusListUrl}/status-lists/register`,
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
      throw getAxionResponse(error, 'Status List', ['register'], correlationId);
    }
  }
  async updateStatusList(
    listId: string,
    index: number,
    updateDao: any,
    accessToken: string,
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
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error(ERROR_MESSAGES.EXTERNAL_API_CALL_FAILD);
      throw getAxionResponse(
        error,
        'Status List',
        [listId, 'entries', `${index}`, `status`],
        correlationId,
      );
    }
  }
}
