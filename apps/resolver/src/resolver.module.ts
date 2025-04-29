import { Module } from '@nestjs/common';
import { ResolverController } from './resolver.controller';
import { ResolverService } from './resolver.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ShareModule } from '@share/share';

@Module({
  imports: [ShareModule, HttpModule, ConfigModule.forRoot({ isGlobal: true })],
  controllers: [ResolverController],
  providers: [ResolverService],
})
export class ResolverModule {}
