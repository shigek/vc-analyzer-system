import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import fs from 'fs';
import path from 'path';
// import { AuthService } from './auth.service'; // 必要に応じて、ユーザーやクライアントの情報を取得するサービス

// JWTペイロードの型定義（JWTに含まれる情報の型）
export interface JwtPayload {
  sub: string; // 通常、サブジェクト（JWTの対象）。Client Credentialsの場合、クライアントIDなど
  clientId: string; // クライアントIDをカスタムクレームとして含む場合
  scopes: string[];
  scope: string;
  // ... その他のペイロード情報 ...
}
const PUBLIC_KEY_FILE_PATH = path.join(
  __dirname,
  '../../..',
  '.certs',
  'public-key.pem',
);

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(
    // private authService: AuthService // 必要に応じてサービスを注入
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // リクエストヘッダーからBearerトークンとしてJWTを抽出
      ignoreExpiration:
        configService.getOrThrow<string>('IGNORE_EXPIRATION') === 'true'
          ? true
          : false, // @@@@@JWTの有効期限切れをチェックする（通常はfalse）
      secretOrKey: fs.readFileSync(PUBLIC_KEY_FILE_PATH, 'utf8'),
      algorithms: ['RS256'],
    });
    this.logger.log('JwtStrategy constructor called');
  }

  // JWT検証後（署名検証、有効期限チェックなどがPassportにより自動で行われる）に呼び出されるメソッド
  // payload には JWT のデコードされた内容が入ります。
  async validate(payload: JwtPayload): Promise<any> {
    // ★★★ ここでペイロードの内容を検証 ★★★
    // Client Credentials フローの場合、ペイロードにクライアントIDなどが含まれているはずです。
    // そのクライアントIDが有効な運営主体のクライアントであるかなどをチェックします。

    // 例: ペイロードの sub が有効なクライアントIDであるかチェック
    // const client = await this.authService.findClientById(payload.sub);
    // if (!client) {
    //   throw new UnauthorizedException(); // 無効なクライアントであれば認証失敗
    // }

    // 検証が成功した場合、validate メソッドは「認証されたユーザー（またはクライアント）」を表す値を返します。
    // この返り値は、後でコントローラーの @Req() user や @GetUser() デコレータでアクセスできるようになります。
    // Client Credentials の場合、返り値はクライアントの情報（クライアントIDなど）にすると良いでしょう。
    const scopes =
      payload.scope && payload.scope.length !== 0
        ? payload.scope.split(',')
        : [];
    return { clientId: payload.sub, scopes: scopes }; // 例: クライアントIDを返す
    // return payload.sub; // sub をそのまま返す場合
  }
}
