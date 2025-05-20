import { Module } from '@nestjs/common';
import { StatusListController } from './status-list.controller';
import { StatusListService } from './status-list.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'lib/share/common/auth/auth.module';
import { ShareModule } from 'lib/share';
import { PersistenceModule } from 'lib/persistence';
import { LoggerModule } from 'lib/share/common/logger/logger-module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from 'lib/share/common/interceptors/logging.interceptor';

@Module({
  imports: [
    LoggerModule,
    PersistenceModule,
    ShareModule,
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [StatusListController],
  providers: [
    StatusListService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class StatusListModule {}
