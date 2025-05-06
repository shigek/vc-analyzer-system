import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ContextController } from './public/context.controller';
import { PublicAnalyzerController } from './public/public.controller';
import { PrivateAnalyzerController } from './private/private.controller';

import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ShareModule } from '@share/share';
import { AuthModule } from './auth/auth.module';
import { VerifiersRequesterService } from './services/verifier/verifiers-requester.service';
import { TrustedListsRequesterService } from './services/manager/trusted-list/trusted-list-requester.service';
import { StatusListsRequesterService } from './services/manager/status-list/status-list-requester.service';
import { storage } from '@share/share/common/strage/storage';

@Module({
  imports: [
    ShareModule,
    HttpModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
  ],
  controllers: [
    AppController,
    ContextController,
    PrivateAnalyzerController,
    PublicAnalyzerController,
  ],
  providers: [
    AppService,
    VerifiersRequesterService,
    TrustedListsRequesterService,
    StatusListsRequesterService,
  ],
})
export class AppModule {}
