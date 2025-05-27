import { LRUCache } from 'lru-cache';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseClient, Issuer } from 'openid-client';
import axios from 'axios'; // AxiosErrorもインポートしておくと型安全
import * as jose from 'jose';
import { KeyFileDataLoader } from 'lib/share/common/key/provider.key';

interface JWKInfo {
  jwk: any; // JSON Web Key データ（またはPEM形式の公開鍵文字列）
  cachedAt: number; // キャッシュに登録されたUNIXタイムスタンプ (ms)
}
const jwksCache = new LRUCache<string, JWKInfo>({
  max: 100,
  ttl: 1000 * 60 * 60 * 24, // 24時間
  updateAgeOnGet: true,
});

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly IDP_BASE_URL: string;
  private readonly keySourceMode: string;
  private readonly logger = new Logger(AuthService.name);
  private issuerInstance: Issuer<BaseClient>;
  private jwksUri: string;
  private userinfoEndpoint: string;
  private keyFileBasePath: string;
  constructor(private configService: ConfigService) {
    const url1 = this.configService.get<string>('IDP_BASE_URL');
    if (!url1) {
      throw new Error('IDP_BASE_URL environment variable is not set.');
    }
    this.IDP_BASE_URL = url1;
    const url2 = this.configService.get<string>('KEY_SOURCE_MODE');
    if (!url2) {
      throw new Error('KEY_SOURCE_MODE environment variable is not set.');
    }
    this.keySourceMode = url2;
  }
  async onModuleInit() {
    try {
      if (this.keySourceMode === 'IDP') {
        this.issuerInstance = await Issuer.discover(this.IDP_BASE_URL);
        if (this.issuerInstance.metadata.jwks_uri) {
          this.jwksUri = this.issuerInstance.metadata.jwks_uri;
        } else {
          throw new Error(
            `Failed to retrieve public keys: 'jwks_uri' endpoint is not provided in the issuer's metadata.`,
          );
        }
        if (this.issuerInstance.metadata.userinfo_endpoint) {
          this.userinfoEndpoint =
            this.issuerInstance.metadata.userinfo_endpoint;
        } else {
          throw new Error(
            `Failed to retrieve user info: 'userinfo_endpoint' endpoint is not provided in the issuer's metadata.`,
          );
        }
      } else if (this.keySourceMode === 'FILE') {
        const url3 = this.configService.get<string>('KEY_FILE_BASE_PATH');
        if (!url3) {
          throw new Error(
            'KEY_FILE_BASE_PATH environment variable is not set.',
          );
        }
        this.keyFileBasePath = url3;
      } else {
        throw new Error(
          `Invalid KEY_SOURCE_MODE: '${this.keySourceMode}'. Expected 'FILE' or 'IDP'.`,
        );
      }
    } catch (error) {
      console.error(`AuthService initialization failed: ${error.message}`);
      throw new Error(`AuthService initialization failed: ${error.message}`);
    }
  }
  /**
   * IDP からユーザー情報を取得する
   * @param accessToken アクセストークン
   * @returns ユーザー情報データ
   */
  async getUserInfo(
    accessToken: string,
  ): Promise<{ id: string; name: string; email: string }> {
    try {
      const response = await axios.get(this.userinfoEndpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          `Failed to get user info from IDP: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`,
        );
      }
      throw new Error(`IDP user info communication error: ${error.message}`);
    }
  }
  /**
   * IDP からユーザー情報を取得する
   * @param accessToken アクセストークン
   * @returns ユーザー情報データ
   */
  async secretOrKeyProvider(
    _request: Request,
    rawJwtToken: any,
    done: (err: any, secretOrKey?: string | Buffer) => void,
  ) {
    try {
      // rawJwtToken からヘッダーをデコードして kid を取得
      const [headerEncoded] = rawJwtToken.split('.');
      const header = JSON.parse(
        Buffer.from(headerEncoded, 'base64').toString(),
      );
      const kid = header.kid;
      const publicKey = await this.getPublicKeyByKid(kid);
      if (!publicKey) {
        done(new Error('Public key not found for kid: ' + kid));
        return;
      }
      done(null, publicKey.replace(/\\n/g, '\n'));
    } catch (err) {
      console.error('secretOrKeyProvider faild: ', err);
      done(new Error('secretOrKeyProvider faild.'));
    }
  }
  testClear() {
    if (
      process.env.NODE_ENV !== 'test'
    ) {
      // development も許容するかは要検討
      throw new Error(
        'UnsupportedOperationError: testClear() can only be called in a test environment.',
      );
    }
    return jwksCache.clear();
  }
  testSet(key: string, value: any) {
    if (
      process.env.NODE_ENV !== 'test'
    ) {
      // development も許容するかは要検討
      throw new Error(
        'UnsupportedOperationError: testClear() can only be called in a test environment.',
      );
    }
    return jwksCache.set(key, value);
  }
  private async getPublicKeyByKid(kid: string): Promise<string | undefined> {
    try {
      let cachedKey = jwksCache.get(kid);
      if (cachedKey) {
        this.logger.debug(`[keyCache] Cache hit for kid: ${kid}`);
        return cachedKey.jwk;
      }
      if (this.keySourceMode === 'IDP') {
        const response = await axios.get(this.jwksUri, {});
        const result = response.data.keys.filter(
          (key: { kid: string }) => key.kid === kid,
        );
        const publicKey = await jose.importJWK(result[0]);
        const publicKeyPem =
          publicKey instanceof CryptoKey
            ? await jose.exportSPKI(publicKey)
            : undefined;
        if (publicKeyPem) {
          jwksCache.set(kid, { jwk: publicKeyPem, cachedAt: Date.now() });
        }
        return publicKeyPem;
      } else if (this.keySourceMode === 'FILE') {
        const { key } = KeyFileDataLoader.keyload(
          `${this.keyFileBasePath}/${kid}`,
        );
        const publicKeyPem = key.replace(/\\n/g, '\n');
        jwksCache.set(kid, { jwk: publicKeyPem, cachedAt: Date.now() });
        return publicKeyPem;
      }
    } catch (error) {
      console.error(`getPublicKEyByKid communication faild: ${error.message}`);
      throw error;
    }
  }
}
