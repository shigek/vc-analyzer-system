import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, SecretOrKeyProvider, Strategy } from 'passport-jwt';
import { fileLoader } from '../key/provider.key';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
// import { AuthService } from './auth.service'; // 必要に応じて、ユーザーやクライアントの情報を取得するサービス

export const Permissions = {
  ISS: 'vc-analyzer-gateway',
  AUD: ['trusted-list-service', 'status-list-service'],
  SUB: 'vc-analyzer-management-client',
};

interface JwtPayload {
  sub: string;
  iss: string;
  aud: string[];
  permissions: string[];
}
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'gateway-jwt') {
  private readonly logger = new Logger(JwtStrategy.name);
  key: string;
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // リクエストヘッダーからBearerトークンとしてJWTを抽出
      ignoreExpiration: true, // JWTの有効期限切れをチェックする（通常はtrue）
      secretOrKeyProvider: secretOrKeyProvider,
      algorithms: ['RS256'],
    });
    const url1 = this.configService.get<string>('GATEWAY_KEY_DATA');
    if (!url1) {
      throw new Error('GATEWAY_KEY_DATA environment variable is not set.');
    }
    this.logger.log('JwtStrategy constructor called');
  }

  // JWT検証後（署名検証、有効期限チェックなどがPassportにより自動で行われる）に呼び出されるメソッド
  // payload には JWT のデコードされた内容が入ります。
  async validate(payload: JwtPayload): Promise<any> {
    // ★★★ ここでペイロードの内容を検証 ★★★
    // Client Credentials フローの場合、ペイロードにクライアントIDなどが含まれているはずです。
    // そのクライアントIDが有効な運営主体のクライアントであるかなどをチェックします。

    if (payload.iss !== Permissions.ISS) {
      throw new UnauthorizedException(); // 無効なクライアントであれば認証失敗
    }
    if (payload.sub !== Permissions.SUB) {
      throw new UnauthorizedException(); // 無効なクライアントであれば認証失敗
    }
    for (const aud of payload.aud) {
      if (!Permissions.AUD.includes(aud)) {
        throw new UnauthorizedException(); // 無効なクライアントであれば認証失敗
      }
    }
    // 検証が成功した場合、validate メソッドは「認証されたユーザー（またはクライアント）」を表す値を返します。
    // この返り値は、後でコントローラーの @Req() user や @GetUser() デコレータでアクセスできるようになります。
    // Client Credentials の場合、返り値はクライアントの情報（クライアントIDなど）にすると良いでしょう。
    return payload; // 例: クライアントIDを返す
    // return payload.sub; // sub をそのまま返す場合
  }
}
// バックエンドサービス側 JwtStrategy で secretOrKeyProvider を使う場合（イメージ）

const secretOrKeyProvider: SecretOrKeyProvider = async (
  request: Request,
  rawJwtToken: any,
  done: (err: any, secretOrKey?: string | Buffer) => void,
) => {
  try {
    // rawJwtToken からヘッダーをデコードして kid を取得
    const [headerEncoded] = rawJwtToken.split('.');
    const header = JSON.parse(Buffer.from(headerEncoded, 'base64').toString());
    const kid = header.kid;
    if (!process.env.GATEWAY_KEY_DATA) {
      done(new Error('Public key not found for kid: ' + kid));
    }
    const publicKey = getPublicKeyByKid(kid, process.env.GATEWAY_KEY_DATA!);
    if (!publicKey) {
      done(new Error('Public key not found for kid: ' + kid));
      return;
    }
    done(null, publicKey.replace(/\\n/g, '\n'));
  } catch (err) {
    done(err);
  }
};
function getPublicKeyByKid(kid: string, url: string): string | undefined {
  const { loader } = fileLoader(url);
  const key = loader.get(kid);
  return key?.public;
}
