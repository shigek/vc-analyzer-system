import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AxiosInstance, AxiosRequestHeaders } from 'axios';
import { ConfigService } from '@nestjs/config';
import {
  HttpClientConfigService,
  RequestConfigWithInternalAuthContext,
} from 'lib/httpclient';
import { getAxionResponse } from 'lib/httpclient/error/error-handler.axios';
import {
  ERROR_MESSAGES,
  SERVICE_NAME,
} from 'lib/share/common/message/common-message';
import { getClientPermissions } from '../../config/authorization.config';

@Injectable()
export class StatusListClientService implements OnModuleInit {
  private readonly logger = new Logger(StatusListClientService.name);
  private axiosInstance: AxiosInstance;
  // 呼び出す内部サービスのベースURL (例: Status List ServiceのURL)
  private readonly INTERNAL_SERVICE_BASE_URL: string;
  private readonly SERVICE_NAME: string;

  constructor(
    private readonly httpConfigClientService: HttpClientConfigService,
    private configService: ConfigService,
    // 他のServiceが必要ならここにインジェクト
  ) {
    const url = this.configService.get<string>('STATUS_LIST_URL');
    if (!url) {
      throw new Error('STATUS_LIST_URL environment variable is not set.');
    }
    this.INTERNAL_SERVICE_BASE_URL = url;
    this.SERVICE_NAME = SERVICE_NAME.STATUS_LIST_SERVICE;
  }
  // Moduleの初期化時にaxiosインスタンスを設定する
  onModuleInit() {
    this.axiosInstance = this.httpConfigClientService.createAuthenticatedClient(
      this.INTERNAL_SERVICE_BASE_URL,
    );
    this.logger.log(
      `[${this.constructor.name}] Initialized with authenticated Axios client.`,
    );
  }

  /**
   * Status List Service から特定のステータスを取得する
   *
   * @param listId
   * @param index
   * @param userContext
   * @returns 取得したステータス情報
   */
  async getStatus(
    listId: string,
    index: number,
    userContext: {
      scopes: string[];
      clientId: string;
    },
  ): Promise<any> {
    try {
      const service = this.SERVICE_NAME;
      const response = await this.axiosInstance.get(
        `/status-lists/${listId}/status/${index}`,
        {
          headers: {} as AxiosRequestHeaders,
          _internalAuthContext: { ...userContext, service },
        } as RequestConfigWithInternalAuthContext,
      );
      return response.data;
    } catch (error) {
      this.logger.error(ERROR_MESSAGES.EXTERNAL_API_CALL_FAILD);
      throw getAxionResponse(error, 'Status List', [listId, `${index}`]);
    }
  }
  /**
   *
   * @param statusData
   * @param userContext
   * @returns
   */
  async createStatus(
    statusData: any,
    userContext: {
      scopes: string[];
      clientId: string;
    },
  ): Promise<any> {
    console.log(`[${this.constructor.name}] Calling createStatus.`);
    try {
      const service = this.SERVICE_NAME;
      const permission = getClientPermissions(userContext.scopes, service);
      const response = await this.axiosInstance.post(
        '/status-lists',
        statusData,
        {
          headers: {} as AxiosRequestHeaders,
          _internalAuthContext: { ...userContext, service, permission },
        } as RequestConfigWithInternalAuthContext,
      );
      return response.data;
    } catch (error) {
      this.logger.error(ERROR_MESSAGES.EXTERNAL_API_CALL_FAILD);
      throw getAxionResponse(error, 'Status List', ['create']);
    }
  }

  /**
   *
   * @param listId
   * @param index
   * @param statusData
   * @param userContext
   * @returns
   */
  async updateStatus(
    listId: string,
    index: number,
    statusData: any,
    userContext: {
      scopes: string[];
      clientId: string;
    },
  ): Promise<any> {
    try {
      const service = this.SERVICE_NAME;
      const permission = getClientPermissions(userContext.scopes, service);
      const response = await this.axiosInstance.patch(
        `/status-lists/${listId}/status/${index}`,
        statusData,
        {
          headers: {} as AxiosRequestHeaders,
          _internalAuthContext: { ...userContext, service, permission },
        } as RequestConfigWithInternalAuthContext,
      );
      return response.data;
    } catch (error) {
      this.logger.error(ERROR_MESSAGES.EXTERNAL_API_CALL_FAILD);
      throw getAxionResponse(error, 'Status List', [listId, `${index}`]);
    }
  }
}
