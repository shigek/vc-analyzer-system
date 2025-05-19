import { Injectable } from '@nestjs/common';
import { fileLoader, KeyData } from 'lib/share/common/key/provider.key';
import * as jwt from 'lib/share/common/jwt/jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalAuthService {
  // 本来は環境変数などから安全に取得・管理する秘密鍵
  // ここではサンプルとしてダミーの文字列を使います
  private readonly keyData: KeyData;
  private readonly kid: string;
  private readonly gatewayServiceName: string;
  constructor(private configService: ConfigService) {
    const url1 = this.configService.get<string>('GATEWAY_KEY_DATA');
    if (!url1) {
      throw new Error('GATEWAY_KEY_DATA environment variable is not set.');
    }
    const url2 = this.configService.get<string>('GATEWAY_KEY');
    if (!url2) {
      throw new Error('GATEWAY_KEY environment variable is not set.');
    }
    this.kid = url2;
    const url3 = this.configService.get<string>('GATEWAY_SERVICE_NAME');
    if (!url3) {
      throw new Error('GATEWAY_SERVICE_NAME environment variable is not set.');
    }
    this.gatewayServiceName = url3;
    const { loader, key } = fileLoader(url1);
    const keyData = loader.get(key);
    if (!keyData) {
      throw new Error('key is not found');
    }
    this.keyData = keyData;
  }
  /**
   * 内部サービス呼び出し用のJWTを生成する
   * @returns 生成されたJWT
   */
  async generateInternalAccessToken(context: {
    [index: string]: any;
    service?: any;
    permission?: any;
  }): Promise<string> {
    // JWTペイロードにGatewayであることを示す情報などを含めることが多い
    const payload = {
      sub: 'gateway', // Subject (誰が発行したか)
      iss: this.gatewayServiceName, // Issuer (発行者)
      aud: [context.service],
      permissions: context.permission,
      iat: Math.floor(Date.now() / 1000),
    };
    // 秘密鍵で署名してJWTを生成
    const token = await jwt.signToken(
      this.keyData,
      payload,
      { kid: this.kid },
      { expiresIn: '5m' },
    );
    console.log('InternalAuthService: Generated internal token:', token);
    return token;
  }

  // (参考) 必要であれば、受信した内部JWTを検証するメソッドなどもここに置く
  // verifyInternalToken(token: string): any { ... }
}
