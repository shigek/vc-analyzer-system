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

  @Get(':subjectDid')
  async hundleTrustedIssuers(
    @Param('subjectDid') subjectDid: string,
    @Res() res: Response,
  ): Promise<any> {
    const request = storage.getStore() as any;
    //1.DIDのバリデート
    this.trustedListService.validateDid(subjectDid);

    //2.ファイル読み込む
    const { credential, currentTrustedListCid } =
      await this.trustedListService.readIpfsDataAndNotFoundError(subjectDid);

    //3.署名検証と、subjectDidのチェック
    await this.trustedListService.verifyProofAndId(subjectDid, credential);

    //4.credentialSubjectの検証
    const { validUntil, status } = await this.trustedListService.verifyCredentialSubject(credential);

    const endTime = process.hrtime(request.startTime);
    const processingTimeMillis = (endTime[0] * 1e9 + endTime[1]) / 1e6;
    const responsePayload = {
      trustedIssuer: subjectDid,
      status: status,
      validUntil: validUntil,
    };
    const finalResponse: CommonResponse<typeof responsePayload> = {
      payload: responsePayload,
      serviceMetadata: {
        serviceName: this.serviceName,
        version: '0.0.1',
        timestamp: new Date().toISOString(),
        processingTimeMillis,
        ipfsGatewayUrl: this.ipfsPeerUrl,
        fetchedCid: currentTrustedListCid,
      },
    };
    return res.send(finalResponse);
  }
}
