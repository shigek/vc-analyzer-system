import { NestFactory } from '@nestjs/core';
import { ResolverModule } from './resolver.module';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { dump } from 'js-yaml';
import fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(ResolverModule);

  const config = new DocumentBuilder()
    .setTitle('VC Analyzer System DID Resolver API') // API のタイトル
    .setDescription(
      'API documentation for the VC Analyzer System management plane.',
    ) // API の説明
    .setVersion('1.0') // API のバージョン
    // .addTag('trusted-issuers') // タグ（API グループ）を追加したい場合
    // .addBearerAuth() // JWT 認証のセキュリティスキームを追加（認証が必要なAPIの場合）
    //.addSecurityRequirements('bearer')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  fs.writeFileSync('./swagger-resolver-spec.yaml', dump(document, {}));
  SwaggerModule.setup('api', app, document); // '/api' というパスで Swagger UI を有効にする

  await app.listen(process.env.port ?? 3001);
}
bootstrap();
