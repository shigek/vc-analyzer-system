import { Module } from '@nestjs/common';
import { HttpClientConfigService } from './httpclient.service';
import { InternalAuthService } from './internal-auth.service';

@Module({
  providers: [HttpClientConfigService, InternalAuthService],
  exports: [HttpClientConfigService, InternalAuthService],
})
export class HttpClientModule {}
