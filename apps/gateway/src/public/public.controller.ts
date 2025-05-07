import { Controller, Get, Headers, Param, Res, Logger } from '@nestjs/common';
import { VerifiersRequesterService } from '../services/verifier/verifiers-requester.service';

import { Response } from 'express';
import { randomUUID } from 'crypto';

@Controller('verifiers')
export class PublicAnalyzerController {
  private readonly logger = new Logger(PublicAnalyzerController.name);
  constructor(
    private readonly verifiersRequesterService: VerifiersRequesterService,
  ) {}
  @Get('resolve/:did')
  async hundleGetDidDocument(
    @Headers('X-Correlation-ID') correlationId: string,
    @Param('did') did: string,
    @Res() res: Response,
  ): Promise<any> {
    const newCorrelationId = correlationId ? correlationId : randomUUID();
    res.send(
      await this.verifiersRequesterService.getDidDocument(
        did,
        newCorrelationId,
      ),
    );
  }

  @Get('status-checks/:listId/:index')
  hundleGetStatus(
    @Headers('X-Correlation-ID') correlationId: string,
    @Param('listId') listId: string,
    @Param('index') index: number,
  ): any {
    const newCorrelationId = correlationId ? correlationId : randomUUID();
    return this.verifiersRequesterService.getStatus(
      listId,
      index,
      newCorrelationId,
    );
  }
  @Get('trusted-issuers/:did')
  handleTrustedIssuer(
    @Headers('X-Correlation-ID') correlationId: string,
    @Param('did') did: string,
  ): any {
    const newCorrelationId = correlationId ? correlationId : randomUUID();
    return this.verifiersRequesterService.isTrustedIssuer(
      did,
      newCorrelationId,
    );
  }
}
