// src/common/logger/logger.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CustomLogger } from './custom-logger.service';
import { CorrelationIdMiddleware } from '../middleware/correlation-id.middleware';

@Module({
  providers: [CustomLogger], // CustomLoggerをプロバイダーとして登録
  exports: [CustomLogger], // 他のモジュールで CustomLogger を使えるようにエクスポート
})
export class LoggerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 全てのルートで CorrelationIdMiddleware を適用
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
