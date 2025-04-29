import { Controller, Get, Headers, Param, Res } from '@nestjs/common';
import { ResolverService } from './resolver.service';
import { ShareService } from '@share/share';
import { Response } from 'express';

@Controller('resolve')
export class ResolverController {
  constructor(
    private shareService: ShareService,
    private readonly resolverService: ResolverService,
  ) {}

  @Get(':did')
  async getDidDocument(
    @Headers('X-Correlation-ID') correlationId: string,
    @Param('did') did: string,
    @Res() res: Response,
  ): Promise<any> {
    const newCorrelationId = correlationId
      ? correlationId
      : this.shareService.generateUUID();
    try {
      const startTime = process.hrtime();
      const didDocument = await this.resolverService.getDidDocument(
        did,
        newCorrelationId,
      );
      const endTime = process.hrtime(startTime);
      res.setHeader('X-Correlation-ID', newCorrelationId);
      const timeTaskMs = (endTime[0] * 1e9 + endTime[1]) / 1e6;
      return res.send({ didDocument, serviceMetadata: { timeTaskMs } });
    } catch (error) {
      throw error;
    }
  }
}
