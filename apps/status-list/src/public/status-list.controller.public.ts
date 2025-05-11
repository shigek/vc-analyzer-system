import { Controller, Get, Param, Res, UseFilters } from '@nestjs/common';
import { StatusListService } from '../services/status-list.service';
import { Response } from 'express';
import { AllExceptionsFilter } from '@share/share/common/filters/all-exceptions.filter';
import { storage } from '@share/share/common/strage/storage';
import { ConfigService } from '@nestjs/config';
import { CommonResponse } from '@share/share/interfaces/response/common-response.interface';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ErrorResponse } from '../dto/error-response.dto';
import { GetOrPutResponse } from '../dto/success-response.dto';

@Controller()
@UseFilters(AllExceptionsFilter)
export class PublicStatusListController {
  private readonly ipfsPeerUrl: string;
  private readonly serviceName: string;
  constructor(
    private configService: ConfigService,
    private readonly statusListService: StatusListService,
  ) {
    const url1 = this.configService.get<string>('STATUS_LIST_SERVICE_NAME');
    if (!url1) {
      throw new Error(
        'STATUS_LIST_SERVICE_NAME environment variable is not set.',
      );
    }
    this.serviceName = url1;
    const url2 = this.configService.get<string>('IPFS_PEER_PUBLIC_URL');
    if (!url2) {
      throw new Error('IPFS_PEER_PUBLIC_URL environment variable is not set.');
    }
    this.ipfsPeerUrl = url2;
  }
  @Get('status-checks/:listId/:index')
  @ApiOperation({
    summary: 'Resolver DID',
    description:
      'このエンドポイントはDIDを解決します。入力としてDIDを受け取ります。',
  })
  @ApiParam({
    name: 'listId',
    description: '解決するDIDを指定する',
    example: 'urn:d8290d62-813d-44a9-98d3-fd27c85f729b',
  })
  @ApiParam({
    name: 'index',
    description: '解決するDIDを指定する',
    example: '123',
  })
  @ApiResponse({
    status: 200,
    description: 'DIDの解決に成功した',
    type: GetOrPutResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'リクエストが無効',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'データが存在しない',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 422,
    description: 'データの検証に失敗した',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 500,
    description: 'サーバー内部エラー',
    type: ErrorResponse,
  })
  async handleStatusCheks(
    @Param('listId') listId: string,
    @Param('index') index: number,
    @Res() res: Response,
  ): Promise<any> {
    const request = storage.getStore() as any;
    //1.ファイル読み込む
    const { credential, currentStatusListCid } =
      await this.statusListService.readIpfsData(listId);
    //2 署名検証と、listIdのチェック
    await this.statusListService.verifyProofAndId(listId, credential);

    //3 ステータスをチェックする。
    const { status, statusCode } = await this.statusListService.verifyStatus(
      index,
      credential,
    );
    const endTime = process.hrtime(request.startTime);
    const processingTimeMillis = (endTime[0] * 1e9 + endTime[1]) / 1e6;
    const responsePayload = {
      statusIssuer: {
        listId,
        index,
      },
      status,
    };
    const finalResponse: CommonResponse<typeof responsePayload> = {
      payload: responsePayload,
      serviceMetadata: {
        serviceName: this.serviceName,
        version: '0.0.1',
        timestamp: new Date().toISOString(),
        processingTimeMillis,
        ipfsGatewayUrl: this.ipfsPeerUrl,
        fetchedCid: currentStatusListCid,
      },
    };
    return res.send(finalResponse);
  }
}
