import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ExternalApiController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ShareModule } from 'lib/share';
import { AuthModule } from './auth/auth.module';
import { randomUUID } from 'crypto';
import { storage } from 'lib/share/common/strage/storage';
import { HttpClientModule } from 'lib/httpclient/httpclient.module';
import { StatusListClientService } from './services/client/status-list.client.service';
import { ResolverClientService } from './services/client/resolver.client.service';
import { TrustedListClientService } from './services/client/trusted-list.client.service';

@Module({
  imports: [
    ShareModule,
    HttpClientModule,
    HttpModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
  ],
  controllers: [ExternalApiController],
  providers: [
    AppService,
    StatusListClientService,
    ResolverClientService,
    TrustedListClientService,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: any, _res: Response, next: () => void) => {
        // リクエストIDの追加
        req.startTime = process.hrtime();
        if (!req.header('X-Correlation-ID')) {
          req.correlationId = randomUUID();
        } else {
          req.correlationId = req.header('X-Correlation-ID');
        }
        storage.run(req, () => next());
      })
      .forRoutes('*');
  }
}
