import { Controller, Get, Param, Res, UseFilters } from '@nestjs/common';
import { TrustedListService } from '../services/trusted-list.service';
import { Response } from 'express';
import { CommonResponse } from '@share/share/interfaces/response/common-response.interface';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from '@share/share/common/filters/all-exceptions.filter';
import { storage } from '@share/share/common/strage/storage';

@Controller('trusted-issuers')
@UseFilters(AllExceptionsFilter)
export class PublicController {
  private readonly ipfsPeerUrl: string;
  private readonly serviceName: string;
  constructor(
    private configService: ConfigService,
    private readonly trustedListService: TrustedListService,
  ) {
    const url1 = this.configService.get<string>('IPFS_PEER_PUBLIC_URL');
    if (!url1) {
      throw new Error('IPFS_PEER_PUBLIC_URL environment variable is not set.');
    }
    this.ipfsPeerUrl = url1;
    const url2 = this.configService.get<string>('TRUSTED_LIST_SERVICE_NAME');
    if (!url2) {
      throw new Error(
        'TRUSTED_LIST_SERVICE_NAME environment variable is not set.',
      );
    }
    this.serviceName = url2;
  }

  @Get(':did')
  async hundleTrustedIssuers(
    @Param('did') subjectDid: string,
    @Res() res: Response,
  ): Promise<any> {
    const request = storage.getStore() as any;
    const response: any =
      await this.trustedListService.getTrustedListAndFilter(subjectDid);
    const endTime = process.hrtime(request.startTime);
    const processingTimeMillis = (endTime[0] * 1e9 + endTime[1]) / 1e6;
    const responsePayload = {
      trustedIssuer: response.trustedIssuer,
      status: response.status,
    };
    const finalResponse: CommonResponse<typeof responsePayload> = {
      payload: responsePayload,
      serviceMetadata: {
        serviceName: this.serviceName,
        version: '0.0.1',
        timestamp: new Date().toISOString(),
        processingTimeMillis,
        ipfsGatewayUrl: this.ipfsPeerUrl,
        fetchedCid: response.fetchedCid,
      },
    };
    return res.status(response.statusCode).send(finalResponse);
  }
}
