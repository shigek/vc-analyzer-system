import { Controller, Get, Headers, Param, Res, Logger } from '@nestjs/common';
import { VerifiersRequesterService } from '../services/verifier/verifiers-requester.service';

import { Response } from 'express';
import { randomUUID } from 'crypto';
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ErrorResponse,
  ExternalServiceErrorResponse,
} from '@share/share/dto/error-response.dto';

@Controller('verifiers')
@ApiTags('verifiers')
export class PublicAnalyzerController {
  private readonly logger = new Logger(PublicAnalyzerController.name);
  constructor(
    private readonly verifiersRequesterService: VerifiersRequesterService,
  ) {}

  @Get('resolve/:did')
  @ApiOperation({ summary: 'DIDドキュメントを取得する' })
  @ApiHeader({
    name: 'X-Correlation-ID',
    description: '処理識別子',
    required: false,
  })
  @ApiParam({ name: 'did', description: '取得するDIDを設定する' })
  @ApiResponse({
    status: 200,
    description: 'DIDドキュメントの取得が正常に終了した',
  })
  @ApiResponse({ status: 400, description: 'リクエストが無効' })
  @ApiResponse({ status: 404, description: 'データが存在しない' })
  @ApiResponse({ status: 422, description: 'データの検証に失敗した' })
  @ApiResponse({ status: 500, description: 'サーバー内部エラー' })
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
  })
  @ApiResponse({
    status: 400,
    description: 'リクエストが無効',
    type: ExternalServiceErrorResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'データが存在しない',
    type: ExternalServiceErrorResponse,
  })
  @ApiResponse({
    status: 422,
    description: 'データの検証に失敗した',
    type: ExternalServiceErrorResponse,
  })
  @ApiResponse({
    status: 500,
    description: 'サーバー内部エラー',
    type: ExternalServiceErrorResponse,
  })
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
  })
  @ApiResponse({
    status: 400,
    description: 'リクエストが無効',
    type: ExternalServiceErrorResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'データが存在しない',
    type: ExternalServiceErrorResponse,
  })
  @ApiResponse({
    status: 422,
    description: 'データの検証に失敗した',
    type: ExternalServiceErrorResponse,
  })
  @ApiResponse({
    status: 500,
    description: 'サーバー内部エラー',
    type: ErrorResponse,
  })
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
