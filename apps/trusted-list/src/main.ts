import { NestFactory } from '@nestjs/core';
import { TrustedListModule } from './trusted-list.module';
import { CustomLogger } from '@share/share/common/logger/custom-logger';
import { HttpException, HttpStatus, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { dump } from 'js-yaml';
import fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(TrustedListModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true, // @@@ 本番環境では true にすることも

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
  const config = new DocumentBuilder()
    .setTitle('VC Analyzer System Trusted List API') // API のタイトル
    .setDescription(
      'API documentation for the VC Analyzer System management plane.',
    ) // API の説明
    .setVersion('1.0') // API のバージョン
    // .addTag('trusted-issuers') // タグ（API グループ）を追加したい場合
    // .addBearerAuth() // JWT 認証のセキュリティスキームを追加（認証が必要なAPIの場合）
    //.addSecurityRequirements('bearer')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  fs.writeFileSync('./swagger-trusted-list-spec.yaml', dump(document, {}));
  SwaggerModule.setup('api', app, document); // '/api' というパスで Swagger UI を有効にする

  await app.listen(process.env.port ?? 3003);
}
bootstrap();
