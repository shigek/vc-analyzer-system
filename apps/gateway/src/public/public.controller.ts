import {
  Controller,
  Get,
  Headers,
  Param,
  Res,
  Logger,
  UseFilters,
} from '@nestjs/common';
import { VerifiersRequesterService } from '../services/verifier/verifiers-requester.service';

import { Response } from 'express';
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponse } from '../dto/error-response.dto';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { storage } from '@share/share/common/strage/storage';

// @@@ 検討
import { GetOrPutResponse } from 'apps/status-list/src/dto/success-response.dto';
import { ResolverSuccessResponse } from 'apps/resolver/src/dto/success-response.dto';
import { GetResponse } from 'apps/trusted-list/src/dto/success-response.dto';

@Controller('verifiers')
@ApiTags('verifiers')
@UseFilters(AllExceptionsFilter)
export class PublicAnalyzerController {
  private readonly logger = new Logger(PublicAnalyzerController.name);
  constructor(
    private readonly verifiersRequesterService: VerifiersRequesterService,
  ) {}

  @ApiOperation({
    summary: 'Resolver DID',
    description:
      'このエンドポイントはDIDを解決します。入力としてDIDを受け取ります。',
  })
  @ApiHeader({
    name: 'X-Correlation-ID',
    description: '処理識別子',
    required: false,
  })
  @ApiHeader({
    name: 'Accept',
    description: '処理識別子',
    examples: {
      'application/did+json': {
        value: 'applicaiton/json',
        description: 'DIDドキュメントのメディアタイプ（JSON）',
      },
      'application/did+ld+json': {
        value: 'applicaiton/did+ld+json',
        description: 'DIDドキュメントのメディアタイプ（JSON-LD）。',
      },
      'application/ld+json;profile="https://w3id.org/did-resolution"': {
        value: 'application/ld+json;profile="https://w3id.org/did-resolution"',
        description: 'DID解決結果のメディアタイプ (JSON-LD).',
      },
    },
    required: false,
  })
  @ApiParam({
    name: 'did',
    description: '解決するDIDを指定する',
    example: 'did:key:z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T',
  })
  @ApiResponse({
    content: ResolverSuccessResponse,
    status: 200,
    description: 'DIDの解決に成功した',
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
    status: 406,
    description: 'サポートされていない表現です。',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 410,
    description: '正常に解決されましたが、DIDは無効化されています。',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 500,
    description: 'サーバー内部エラー',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 501,
    description: 'DIDメソッドはサポートされていません',
    type: ErrorResponse,
  })
  @Get('resolve/:did')
  async hundleGetDidDocument(
    @Headers('Accept') accept: string,
    @Param('did') did: string,
    @Res() res: Response,
  ): Promise<any> {
    const request = storage.getStore() as any;
    res.send(
      await this.verifiersRequesterService.getDidDocument(
        did,
        accept,
        request.correlationId,
      ),
    );
  }

  @ApiOperation({ summary: 'Status listの状態を取得する' })
  @ApiHeader({
    name: 'X-Correlation-ID',
    description: '処理識別子',
    required: false,
  })
  @ApiParam({ name: 'listId', description: 'Status list lisの識別子' })
  @ApiParam({
    name: 'index',
    description: 'Status listの状態が設定されている位置情報',
  })
  @ApiResponse({
    status: 200,
    description: 'Status listの状態取得が正常に終了した',
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
  @Get('status-checks/:listId/:index')
  hundleGetStatus(
    @Headers('X-Correlation-ID') correlationId: string,
    @Param('listId') listId: string,
    @Param('index') index: number,
  ): any {
    const request = storage.getStore() as any;
    return this.verifiersRequesterService.getStatus(
      listId,
      index,
      request.correlationId,
    );
  }
  @ApiOperation({ summary: 'Trusted listの状態を取得する' })
  @ApiHeader({
    name: 'X-Correlation-ID',
    description: '処理識別子',
    required: false,
  })
  @ApiParam({ name: 'did', description: '発行者のDID' })
  @ApiResponse({
    status: 200,
    description: 'Status listの状態取得が正常に終了した',
    type: GetResponse,
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
  @Get('trusted-issuers/:did')
  handleTrustedIssuer(
    @Headers('X-Correlation-ID') correlationId: string,
    @Param('did') did: string,
  ): any {
    const request = storage.getStore() as any;
    return this.verifiersRequesterService.isTrustedIssuer(
      did,
      request.correlationId,
    );
  }
}
