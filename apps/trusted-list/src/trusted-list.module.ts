import { Module } from '@nestjs/common';
import { TrustedListService } from './trusted-list.service';
import { ConfigModule } from '@nestjs/config';
import { ShareModule } from 'lib/share/share.module';
import { AuthModule } from 'lib/share/common/auth/auth.module';
import { PersistenceModule } from 'lib/persistence';
import { TrustedListController } from './trusted-list.controller';
import { LoggerModule } from 'lib/share/common/logger/logger-module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from 'lib/share/common/interceptors/logging.interceptor';

@Module({
  imports: [
    LoggerModule,
    PersistenceModule,
    AuthModule,
    ShareModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [TrustedListController],
  providers: [
    TrustedListService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class TrustedListModule {}
