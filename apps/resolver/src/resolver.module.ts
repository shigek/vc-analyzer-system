import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ResolverController } from './resolver.controller';
import { ResolverService } from './resolver.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ShareModule } from 'lib/share';
import { randomUUID } from 'crypto';
import { storage } from 'lib/share/common/strage/storage';

@Module({
  imports: [ShareModule, HttpModule, ConfigModule.forRoot({ isGlobal: true })],
  controllers: [ResolverController],
  providers: [ResolverService],
})
export class ResolverModule {
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
