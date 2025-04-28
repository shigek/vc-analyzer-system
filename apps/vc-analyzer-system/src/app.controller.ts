import { Controller, Get, Headers, Param, Res } from '@nestjs/common';
import { MicroserviceRequesterService } from './services/microservice-requester.service';
import { AppService } from './app.service';
import { ShareService } from '@share/share'
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly microserviceRequesterService: MicroserviceRequesterService,
    private shareService: ShareService
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('resolve/:did')
  async getDidDocument(@Headers('X-Correlation-ID') correlationId: string, @Param('did') did: string, @Res() res: Response): Promise<any> {
    try {
      const newCorrelationId = (correlationId) ? correlationId : this.shareService.generateUUID();
      res.setHeader('X-Correlation-ID', newCorrelationId);
      res.send(await this.microserviceRequesterService.getDidDocument(did, newCorrelationId));
    } catch (error) {
      throw error;
    }
  }

  @Get('status-checks/:listId/:index')
  getStatus(@Headers('X-Correlation-ID') correlationId: string, @Param('listId') listId: string, @Param('index') index: number): any {
    const newCorrelationId = (correlationId) ? correlationId : this.shareService.generateUUID();
    return this.microserviceRequesterService.getStatus(listId, index, newCorrelationId);
  }

  @Get('trusted-issuers/:did')
  isTrustedIssuer(@Headers('X-Correlation-ID') correlationId: string, @Param('did') did: string): any {
    const newCorrelationId = (correlationId) ? correlationId : this.shareService.generateUUID();
    return this.microserviceRequesterService.isTrustedIssuer(did, newCorrelationId);
  }
}
