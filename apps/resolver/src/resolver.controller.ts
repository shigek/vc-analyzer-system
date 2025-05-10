import {
  Controller,
  Get,
  Headers,
  HttpException,
  Param,
  Res,
} from '@nestjs/common';
import { ResolverService } from './resolver.service';
import { Response } from 'express';
import { storage } from '@share/share/common/strage/storage';
import { ConfigService } from '@nestjs/config';
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import {
  ErrorResponse,
  ExternalServiceErrorResponse,
} from '@share/share/dto/error-response.dto';
import { ResolverSuccessResponse } from '@share/share/dto/success-response.dto';

@Controller('resolve')
export class ResolverController {
  private readonly serviceName: string;
  constructor(
    private readonly resolverService: ResolverService,
    private configService: ConfigService,
  ) {
    const url2 = this.configService.get<string>('DID_RESOLVER_SERVICE_NAME');
    if (!url2) {
      throw new Error(
        'DID_RESOLVER_SERVICE_NAME environment variable is not set.',
      );
    }
    this.serviceName = url2;
  }
  @Get(':did')
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
        description:
          'DID解決結果のメディアタイプ (JSON-LD).',
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
    type: ExternalServiceErrorResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'データが存在しない',
    type: ExternalServiceErrorResponse,
  })
  @ApiResponse({
    status: 406,
    description: 'サポートされていない表現です。',
    type: ExternalServiceErrorResponse,
  })
  @ApiResponse({
    status: 410,
    description: '正常に解決されましたが、DIDは無効化されています。',
    type: ExternalServiceErrorResponse,
  })
  @ApiResponse({
    status: 500,
    description: 'サーバー内部エラー',
    type: ErrorResponse,
  })
  @ApiResponse({
    status: 501,
    description: 'DIDメソッドはサポートされていません',
    type: ExternalServiceErrorResponse,
  })
  async handleGetUniversalResol(
    @Param('did') did: string,
    @Headers('Accept') accept: string,
    @Res() res: Response,
  ): Promise<any> {
    const request = storage.getStore() as any;
    try {
      console.log(accept);
      const { content, didDocument } =
        await this.resolverService.getDidDocumentFromUniversalResolver(
          did,
          accept,
          request.correlationId,
        );
      res.setHeader('Content-Type', content);
      return res.send(didDocument);
    } catch (error) {
      if (error instanceof HttpException) {
        const endTime = process.hrtime(request.startTime);
        const processingTimeMillis = (endTime[0] * 1e9 + endTime[1]) / 1e6;
        const finalErrorResponse = {
          error: error.getResponse(),
          serviceMetadata: {
            serviceName: this.serviceName,
            version: '0.0.1',
            timestamp: new Date().toISOString(),
            processingTimeMillis,
          },
        };
        throw new HttpException(finalErrorResponse, error.getStatus());
      } else {
        throw error;
      }
    }
  }
}
