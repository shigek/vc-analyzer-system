import { NestFactory } from '@nestjs/core';
import { TrustedListModule } from './trusted-list.module';

async function bootstrap() {
  const app = await NestFactory.create(TrustedListModule);
  await app.listen(process.env.port ?? 3003);
}
bootstrap();
