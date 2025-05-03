import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PublicAnalyzerController } from './public/public.controller';
import { PrivateAnalyzerController } from './private/private.controller';

import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ShareModule } from '@share/share';
import { VerifiersRequesterService } from './services/verifier/verifiers-requester.service';
import { IssuersRequesterService } from './services/issuer/issuers-requester.service';

@Module({
  imports: [ShareModule, HttpModule, ConfigModule.forRoot({ isGlobal: true })],
  controllers: [
    AppController,
    PrivateAnalyzerController,
    PublicAnalyzerController,
  ],
  providers: [AppService, VerifiersRequesterService, IssuersRequesterService],
})
export class AppModule {}
