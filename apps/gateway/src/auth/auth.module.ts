import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import fs from 'fs';
import path from 'path';
import { AuthService } from './auth.service';

const PRIVATE_KEY_FILE_PATH = path.join(
  __dirname,
  '../../..',
  '.certs',
  'private-key.pem',
);
const PUBLIC_KEY_FILE_PATH = path.join(
  __dirname,
  '../../..',
  '.certs',
  'public-key.pem',
);

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: async (_configService: ConfigService) => {
        return {
          // envファイルから秘密鍵を渡す
          defaultStrategy: 'jwt',
          privateKey: fs.readFileSync(PRIVATE_KEY_FILE_PATH),
          publicKey: fs.readFileSync(PUBLIC_KEY_FILE_PATH),
          signOptions: {
            algorithm: 'RS256',
            expiresIn: '60m',
          },
        };
      },
      inject: [ConfigService], // useFactoryで使う為にConfigServiceを注入する
    }),
  ],
  providers: [
    JwtStrategy, // 作成するStrategyをプロバイダーに登録
    AuthService, // 認証サービスなど
  ],
  // exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
