import { NestFactory } from '@nestjs/core';
import { ResolverModule } from './resolver.module';

async function bootstrap() {
  const app = await NestFactory.create(ResolverModule);
  await app.listen(process.env.port ?? 3001);
}
bootstrap();
