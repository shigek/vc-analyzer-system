import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*', // 許可するオリジン
    methods: 'GET', // 許可する HTTP メソッド
    credentials: true, // Cookie を送信する場合に設定
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
