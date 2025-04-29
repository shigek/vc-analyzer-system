import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import { MicroserviceRequesterService } from './services/microservice-requester.service';
import { AppService } from './app.service';
import { CreateDao, ShareService, UpdateDao } from '@share/share';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly microserviceRequesterService: MicroserviceRequesterService,
    private shareService: ShareService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('resolve/:did')
  async getDidDocument(
    @Headers('X-Correlation-ID') correlationId: string,
    @Param('did') did: string,
    @Res() res: Response,
  ): Promise<any> {
    try {
      const newCorrelationId = correlationId
        ? correlationId
        : this.shareService.generateUUID();
      res.setHeader('X-Correlation-ID', newCorrelationId);
      res.send(
        await this.microserviceRequesterService.getDidDocument(
          did,
          newCorrelationId,
        ),
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('status-checks/:listId/:index')
  getStatus(
    @Headers('X-Correlation-ID') correlationId: string,
    @Param('listId') listId: string,
    @Param('index') index: number,
  ): any {
    const newCorrelationId = correlationId
      ? correlationId
      : this.shareService.generateUUID();
    return this.microserviceRequesterService.getStatus(
      listId,
      index,
      newCorrelationId,
    );
  }
  @Get('trusted-issuers/:did')
  isTrustedIssuer(
    @Headers('X-Correlation-ID') correlationId: string,
    @Param('did') did: string,
  ): any {
    const newCorrelationId = correlationId
      ? correlationId
      : this.shareService.generateUUID();
    return this.microserviceRequesterService.isTrustedIssuer(
      did,
      newCorrelationId,
    );
  }
  @Post('status-lists/register')
  postStatus(
    @Headers('X-Correlation-ID') correlationId: string,
    @Body() createDao: CreateDao,
  ): any {
    const newCorrelationId = correlationId
      ? correlationId
      : this.shareService.generateUUID();
    return this.microserviceRequesterService.createStatusList(
      createDao,
      newCorrelationId,
    );
  }

  @Put('status-lists/:listId/entries/:index/status')
  async putStatus(
    @Headers('X-Correlation-ID') correlationId: string,
    @Param('listId') listId: string,
    @Param('index') index: number,
    @Body() updateDao: UpdateDao,
  ): Promise<any> {
    const newCorrelationId = correlationId
      ? correlationId
      : this.shareService.generateUUID();
    return this.microserviceRequesterService.updateStatus(
      listId,
      index,
      updateDao,
      newCorrelationId,
    );
  }
}
