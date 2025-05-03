import { Controller, Get, Headers, Param, Res } from '@nestjs/common';
import { TrustedListService } from './trusted-list.service';
import { ResponseDao, ShareService } from '@share/share';
import { Response } from 'express';
import { CommonResponse } from '@share/share/interfaces/common-response';

@Controller('trusted-issuers')
export class TrustedListController {
  constructor(
    private shareService: ShareService,
    private readonly trustedListService: TrustedListService,
  ) {}

  @Get(':did')
  async hundleTrustedIssuers(
    @Headers('X-Correlation-ID') correlationId: string,
    @Param('did') did: string,
    @Res() res: Response,
  ): Promise<any> {
    const newCorrelationId = correlationId
      ? correlationId
      : this.shareService.generateUUID();
    try {
      const startTime = process.hrtime();
      const response: any =
        await this.trustedListService.getTrustedListAndFilter(
          did,
          newCorrelationId,
        );
      const endTime = process.hrtime(startTime);
      res.setHeader('X-Correlation-ID', newCorrelationId);
      const processingTimeMillis = (endTime[0] * 1e9 + endTime[1]) / 1e6;
      const responsePayload = {
        trustedIssuer: response.trustedIssuer,
        status: response.status,
      };
      const finalResponse: CommonResponse<typeof responsePayload> = {
        payload: responsePayload,
        serviceMetadata: {
          serviceName: 'Trusted List Analyzer Service',
          version: '0.01',
          timestamp: new Date().toISOString(),
          processingTimeMillis,
          ipfsGatewayUrl: '.........',
          fetchedCid: response.fetchedCid,
        },
      };
      return res.status(response.statusCode).send(finalResponse);
    } catch (error) {
      throw error;
    }
  }
}
