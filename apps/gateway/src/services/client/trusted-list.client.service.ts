import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestHeaders } from 'axios';
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
export class TrustedListClientService implements OnModuleInit {
  private readonly logger = new Logger(TrustedListClientService.name);
  private axiosInstance: AxiosInstance;
  private readonly INTERNAL_SERVICE_BASE_URL: string;
  private readonly SERVICE_NAME: string;

  constructor(
    private readonly httpConfigClientService: HttpClientConfigService,
    private configService: ConfigService,
  ) {
    const url = this.configService.get<string>('TRUSTED_LIST_URL');
    if (!url) {
      throw new Error('TRUSTED_LIST_URL environment variable is not set.');
    }
    this.INTERNAL_SERVICE_BASE_URL = url;
    this.SERVICE_NAME = SERVICE_NAME.TRUSTED_LIST_SERVICE;
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
  async getIssuer(
    subjectDid: string,
    userContext: {
      scopes: string[];
      clientId: string;
    },
  ): Promise<any> {
    try {
      const service = this.SERVICE_NAME;
      const response = await this.axiosInstance.get(
        `/trusted-issuers/${subjectDid}`,
        {
          headers: {} as AxiosRequestHeaders,
          _internalAuthContext: { ...userContext, service },
        } as RequestConfigWithInternalAuthContext,
      );
      return response.data;
    } catch (error) {
      this.logger.error(ERROR_MESSAGES.EXTERNAL_API_CALL_FAILD, error.message);
      throw getAxionResponse(error, 'Trusted List', [subjectDid]);
    }
  }
  /**
   *
   * @param did
   * @param userContext
   * @returns
   */
  async getIssuers(userContext: {
    scopes: string[];
    clientId: string;
  }): Promise<any> {
    try {
      const service = this.SERVICE_NAME;
      const permission = getClientPermissions(userContext.scopes, service);
      const response = await this.axiosInstance.get(`/trusted-issuers`, {
        headers: {} as AxiosRequestHeaders,
        _internalAuthContext: { ...userContext, service, permission },
      } as RequestConfigWithInternalAuthContext);
      return response.data;
    } catch (error) {
      this.logger.error(ERROR_MESSAGES.EXTERNAL_API_CALL_FAILD, error.message);
      throw getAxionResponse(error, 'Trusted List', []);
    }
  }
  /**
   *
   * @param issuerData
   * @param userContext
   * @returns
   */
  async createIssuer(
    issuerData: any,
    userContext: {
      scopes: string[];
      clientId: string;
    },
  ): Promise<any> {
    try {
      const service = this.SERVICE_NAME;
      const permission = getClientPermissions(userContext.scopes, service);
      const response = await this.axiosInstance.post(
        '/trusted-issuers',
        issuerData,
        {
          headers: {} as AxiosRequestHeaders,
          _internalAuthContext: { ...userContext, service, permission },
        } as RequestConfigWithInternalAuthContext,
      );
      return response.data;
    } catch (error) {
      this.logger.error(ERROR_MESSAGES.EXTERNAL_API_CALL_FAILD, error.message);
      throw getAxionResponse(error, 'Trusted List', ['create']);
    }
  }
  /**
   *
   * @param did
   * @param issuerData
   * @param userContext
   * @returns
   */
  async updateIssuer(
    subjectDid: string,
    issuerData: any,
    userContext: {
      scopes: string[];
      clientId: string;
    },
  ): Promise<any> {
    try {
      const service = this.SERVICE_NAME;
      const permission = getClientPermissions(userContext.scopes, service);
      const response = await this.axiosInstance.patch(
        `/trusted-issuers/${subjectDid}`,
        issuerData,
        {
          headers: {} as AxiosRequestHeaders,
          _internalAuthContext: { ...userContext, service, permission },
        } as RequestConfigWithInternalAuthContext,
      );
      return response.data;
    } catch (error) {
      this.logger.error(ERROR_MESSAGES.EXTERNAL_API_CALL_FAILD, error.message);
      throw getAxionResponse(error, 'Trusted List', [subjectDid]);
    }
  }
  async deleteIssuer(
    subjectDid: string,
    userContext: {
      scopes: string[];
      clientId: string;
    },
  ): Promise<any> {
    try {
      const service = this.SERVICE_NAME;
      const permission = getClientPermissions(userContext.scopes, service);
      const response = await this.axiosInstance.delete(
        `trusted-issuers/${subjectDid}`,
        {
          headers: {} as AxiosRequestHeaders,
          _internalAuthContext: { ...userContext, service, permission },
        } as RequestConfigWithInternalAuthContext,
      );
      return response.data;
    } catch (error) {
      this.logger.error(ERROR_MESSAGES.EXTERNAL_API_CALL_FAILD, error.message);
      throw getAxionResponse(error, 'Trusted list', [subjectDid]);
    }
  }
}
