import { MiddlewareConsumer, Module } from '@nestjs/common';
import { PublicController } from './public/public.controller';
import { ProtectedController } from './protected/protected.controller';
import { TrustedListService } from './services/trusted-list.service';
import { ConfigModule } from '@nestjs/config';
import { ShareModule } from '@share/share/share.module';
import type { Response } from 'express';
import { randomUUID } from 'crypto';
import { storage } from '@share/share/common/strage/storage';
import { AuthModule } from '@share/share/common/auth/auth.module';

@Module({
  imports: [AuthModule, ShareModule, ConfigModule.forRoot({ isGlobal: true })],
  controllers: [PublicController, ProtectedController],
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
