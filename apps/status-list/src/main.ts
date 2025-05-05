import { NestFactory } from '@nestjs/core';
import { StatusListModule } from './status-list.module';
import { HttpException, HttpStatus, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { CustomLogger } from '@share/share/common/logger/custom-logger';

async function bootstrap() {
  const app = await NestFactory.create(StatusListModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      // disableErrorMessages: true, // 本番環境では true にすることも

      exceptionFactory: (errors: ValidationError[]) => {
        return new HttpException(
          {
            message: 'Input validation failed.', // 例: 汎用メッセージ
            errors, // フィールド名を validationErrors など任意にする
          },
          HttpStatus.BAD_REQUEST,
        ); // HTTP 400 Bad Request を投げる
      },
    }),
  );
  app.useLogger(new CustomLogger());
  await app.listen(process.env.port ?? 3002);
}
bootstrap();
