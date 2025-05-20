import { Module } from '@nestjs/common';
import { ResolverController } from './resolver.controller';
import { ResolverService } from './resolver.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ShareModule } from 'lib/share';
import { LoggerModule } from 'lib/share/common/logger/logger-module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from 'lib/share/common/interceptors/logging.interceptor';

@Module({
  imports: [
    LoggerModule,
    ShareModule,
    HttpModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [ResolverController],
  providers: [
    ResolverService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class ResolverModule {}
