import { Module } from '@nestjs/common';
import { StatusListController } from './status-list.controller';
import { StatusListService } from './status-list.service';
import { ConfigModule } from '@nestjs/config';
import { ShareModule } from '@share/share';

@Module({
  imports: [ShareModule, ConfigModule.forRoot({ isGlobal: true })],
  controllers: [StatusListController],
  providers: [StatusListService],
})
export class StatusListModule {}
