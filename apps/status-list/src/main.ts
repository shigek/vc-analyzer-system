import { NestFactory } from '@nestjs/core';
import { StatusListModule } from './status-list.module';

async function bootstrap() {
  const app = await NestFactory.create(StatusListModule);
  await app.listen(process.env.port ?? 3002);
}
bootstrap();
