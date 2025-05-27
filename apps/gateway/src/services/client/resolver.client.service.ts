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

@Injectable()
export class ResolverClientService implements OnModuleInit {
  private readonly logger = new Logger(ResolverClientService.name);
  private axiosInstance: AxiosInstance;
  // 呼び出す内部サービスのベースURL (例: Status List ServiceのURL)
  private readonly INTERNAL_SERVICE_BASE_URL: string;

  constructor(
    private readonly httpConfigClientService: HttpClientConfigService,
    private configService: ConfigService,
    // 他のServiceが必要ならここにインジェクト
  ) {
    const url = this.configService.get<string>('DID_RESOLVER_URL');
    if (!url) {
      throw new Error('DID_RESOLVER_URL environment variable is not set.');
    }
    this.INTERNAL_SERVICE_BASE_URL = url;
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
   *
   * @param did
   * @param userContext
   * @returns
   */
  async getDidDocument(
    did: string,
    accept: string,
    userContext: {
      scopes?: string[];
      clientId?: string;
    },
  ): Promise<any> {
    try {
      const service = SERVICE_NAME.RESOLVER_LIST_SERVICE;
      const response = await this.axiosInstance.get(`/resolve/${did}`, {
        headers: { Accept: accept } as AxiosRequestHeaders,
        _internalAuthContext: { ...userContext, service },
      } as RequestConfigWithInternalAuthContext);
      return response.data;
    } catch (error) {
      this.logger.error(ERROR_MESSAGES.EXTERNAL_API_CALL_FAILD, error.message);
      throw getAxionResponse(error, 'Did resolver', [did]);
    }
  }
}
