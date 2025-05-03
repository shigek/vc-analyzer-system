import { NestFactory } from '@nestjs/core';
import { TrustedListModule } from './trusted-list.module';

async function bootstrap() {
  const app = await NestFactory.create(TrustedListModule);

  app.enableCors({
    origin: '*', // 許可するオリジン
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // 許可する HTTP メソッド
    credentials: true, // Cookie を送信する場合に設定
  });

  await app.listen(process.env.port ?? 3003);
}
bootstrap();
