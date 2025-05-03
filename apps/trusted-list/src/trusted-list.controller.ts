import { Controller, Get, Headers, Param, Res } from '@nestjs/common';
import { TrustedListService } from './trusted-list.service';
import { ResponseDao, ShareService } from '@share/share';
import { Response } from 'express';

@Controller('trusted-issuers')
export class TrustedListController {
  constructor(
    private shareService: ShareService,
    private readonly trustedListService: TrustedListService,
  ) {}

  @Get(':did')
  async getTrustedIssuers(
    @Headers('X-Correlation-ID') correlationId: string,
    @Param('did') did: string,
    @Res() res: Response,
  ): Promise<any> {
    const newCorrelationId = correlationId
      ? correlationId
      : this.shareService.generateUUID();
    try {
      const startTime = process.hrtime();
      const response: ResponseDao =
        await this.trustedListService.getTrustedListAndFilter(
          did,
          newCorrelationId,
        );

      const endTime = process.hrtime(startTime);
      res.setHeader('X-Correlation-ID', newCorrelationId);
      const timeTaskMs = (endTime[0] * 1e9 + endTime[1]) / 1e6;
      return res.send({
        status: response['status'],
        serviceMetadata: { ...response.serviceMetaData, timeTaskMs },
      });
    } catch (error) {
      throw error;
    }
  }
}
