import { Controller, Get, Headers, Param, Res, Logger } from '@nestjs/common';
import { VerifiersRequesterService } from '../services/verifier/verifiers-requester.service';

import { ShareService } from '@share/share';
import { Response } from 'express';

@Controller('verifiers')
export class PublicAnalyzerController {
  private readonly logger = new Logger(PublicAnalyzerController.name);
  constructor(
    private readonly verifiersRequesterService: VerifiersRequesterService,
    private shareService: ShareService,
  ) {}
  @Get('resolve/:did')
  async getWellcome(
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
        await this.verifiersRequesterService.getDidDocument(
          did,
          newCorrelationId,
        ),
      );
    } catch (error) {
      throw error;
    }
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
        await this.verifiersRequesterService.getDidDocument(
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
    return this.verifiersRequesterService.getStatus(
      listId,
      index,
      newCorrelationId,
    );
  }
  @Get('trusted-lists/:did')
  isTrustedIssuer(
    @Headers('X-Correlation-ID') correlationId: string,
    @Param('did') did: string,
  ): any {
    const newCorrelationId = correlationId
      ? correlationId
      : this.shareService.generateUUID();
    return this.verifiersRequesterService.isTrustedIssuer(
      did,
      newCorrelationId,
    );
  }
}
