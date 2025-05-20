import { Module } from '@nestjs/common';
import { ExternalApiController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ShareModule } from 'lib/share';
import { AuthModule } from './auth/auth.module';
import { HttpClientModule } from 'lib/httpclient/httpclient.module';
import { StatusListClientService } from './services/client/status-list.client.service';
import { ResolverClientService } from './services/client/resolver.client.service';
import { TrustedListClientService } from './services/client/trusted-list.client.service';
import { LoggerModule } from 'lib/share/common/logger/logger-module';
import { LoggingInterceptor } from 'lib/share/common/interceptors/logging.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    LoggerModule,
    ShareModule,
    HttpClientModule,
    HttpModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
  ],
  controllers: [ExternalApiController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    StatusListClientService,
    ResolverClientService,
    TrustedListClientService,
  ],
})
export class AppModule {}
