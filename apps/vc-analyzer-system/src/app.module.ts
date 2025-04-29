import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { MicroserviceRequesterService } from './services/microservice-requester.service';
import { ShareModule } from '@share/share';

@Module({
  imports: [ShareModule, HttpModule, ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController],
  providers: [AppService, MicroserviceRequesterService],
})
export class AppModule {}
