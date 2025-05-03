import { Module } from '@nestjs/common';
import { TrustedListController } from './trusted-list.controller';
import { TrustedListService } from './trusted-list.service';
import { ConfigModule } from '@nestjs/config';
import { ShareModule } from '@share/share/share.module';
import { DidModule } from '@share/share/did/did.module';

@Module({
  imports: [ShareModule, DidModule, ConfigModule.forRoot({ isGlobal: true })],
  controllers: [TrustedListController],
  providers: [TrustedListService],
})
export class TrustedListModule {}
