import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { dump } from 'js-yaml';
import fs from 'fs';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // ★★★ Swagger の設定 ★★★
  const config = new DocumentBuilder()
    .setTitle('VC Analyzer System GateWay API') // API のタイトル
    .setDescription(
      'API documentation for the VC Analyzer System management plane.',
    ) // API の説明
    .setVersion('1.0') // API のバージョン
    // .addTag('trusted-issuers') // タグ（API グループ）を追加したい場合
    // .addBearerAuth() // JWT 認証のセキュリティスキームを追加（認証が必要なAPIの場合）
    //.addSecurityRequirements('bearer')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  fs.writeFileSync('./swagger-gateway-spec.yaml', dump(document, {}));
  SwaggerModule.setup('api', app, document); // '/api' というパスで Swagger UI を有効にする
  app.use(helmet());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
