import { Injectable } from '@nestjs/common';
import { InternalAuthService } from './internal-auth.service';
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { asyncLocalStorage } from 'lib/share/common/middleware/correlation-id.middleware';

export interface RequestConfigWithInternalAuthContext
  extends InternalAxiosRequestConfig {
  _internalAuthContext?: {
    service: string;
    scopes: string[];
    permission?: string[];
    [key: string]: any;
  };
  // 必要に応じて他のカスタムプロパティを追加
}

@Injectable()
export class HttpClientConfigService {
  constructor(private readonly internalAuthService: InternalAuthService) {}
  /**
   * 指定されたbaseURLで、認証インターセプター付きの axios インスタンスを作成する
   * @param baseURL 呼び出すサービスのベースURL
   * @returns 設定済みの axios インスタンス
   */
  createAuthenticatedClient(baseURL: string): AxiosInstance {
    const instance = axios.create({
      baseURL: baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // リクエストインターセプターの設定
    instance.interceptors.request.use(
      async (
        config: RequestConfigWithInternalAuthContext,
      ): Promise<RequestConfigWithInternalAuthContext> => {
        console.log(
          `[HttpClientConfigService] Interceptor: Adding internal token for ${config.baseURL}${config.url}`,
        );
        const context = config._internalAuthContext;
        if (context) {
          try {
            const token =
              await this.internalAuthService.generateInternalAccessToken(
                context,
              );
            config.headers['Authorization'] = `Bearer ${token}`;
            console.log(`[HttpClientConfigService] Interceptor: Token added.`);
            const store = asyncLocalStorage.getStore();
            const correlationId =
              store && store.has('correlationId')
                ? store.get('correlationId')
                : undefined;
            config.headers['X-Correlation-ID'] = correlationId;
          } catch (error) {
            console.error(
              `[HttpClientConfigService] Interceptor Error generating token:`,
              error,
            );
            return Promise.reject(error);
          }
        } else {
          console.warn(
            `[HttpClientConfigService] Interceptor: No internal auth context found for this request. Proceeding without token.`,
          );
          // コンテキスト必須の場合はここで reject するなどのエラー処理
          // return Promise.reject(new Error('Internal auth context missing'));
        }
        return config;
      },
      (error) => {
        console.error(
          `[HttpClientConfigService] Interceptor Error before sending request:`,
          error,
        );
        return Promise.reject(error);
      },
    );

    // レスポンスインターセプターなどもここに追加可能

    return instance;
  }
}
