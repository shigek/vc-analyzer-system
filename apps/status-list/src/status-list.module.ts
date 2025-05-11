import { MiddlewareConsumer, Module } from '@nestjs/common';
import { PublicStatusListController } from './public/status-list.controller.public';
import { ProtectedStatusListController } from './protected/status-list.controller.protected';
import { StatusListService } from './services/status-list.service';
import { ConfigModule } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { storage } from '@share/share/common/strage/storage';
import { AuthModule } from '@share/share/common/auth/auth.module';

@Module({
  imports: [AuthModule, ConfigModule.forRoot({ isGlobal: true })],
  controllers: [ProtectedStatusListController, PublicStatusListController],
  providers: [StatusListService],
})
export class StatusListModule {
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
