import { Controller, Get, Headers, Param } from '@nestjs/common';
import { MicroserviceRequesterService } from './services/microservice-requester.service';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly microserviceRequesterService: MicroserviceRequesterService,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('resolve/:did')
  getDidDocument(@Headers('X-Correlation-ID') correlationId: string, @Param('did') did: string): any {
    return this.microserviceRequesterService.getDidDocument(did, correlationId);
  }

  @Get('status-checks/:listId/:index')
  getStatus(@Headers('X-Correlation-ID') correlationId: string, @Param('listId') listId: string, @Param('index') index: number): any {
    return this.microserviceRequesterService.getStatus(listId, index, correlationId);
  }

  @Get('trusted-issuers/:did')
  isTrustedIssuer(@Headers('X-Correlation-ID') correlationId: string, @Param('did') did: string): any {
    return this.microserviceRequesterService.isTrustedIssuer(did, correlationId);
  }
}
