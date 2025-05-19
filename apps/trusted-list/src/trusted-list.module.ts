import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TrustedListService } from './trusted-list.service';
import { ConfigModule } from '@nestjs/config';
import { ShareModule } from 'lib/share/share.module';
import type { Response } from 'express';
import { randomUUID } from 'crypto';
import { storage } from 'lib/share/common/strage/storage';
import { AuthModule } from 'lib/share/common/auth/auth.module';
import { PersistenceModule } from 'lib/persistence';
import { TrustedListController } from './trusted-list.controller';

@Module({
  imports: [
    PersistenceModule,
    AuthModule,
    ShareModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [TrustedListController],
  providers: [TrustedListService],
})
export class TrustedListModule {
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
