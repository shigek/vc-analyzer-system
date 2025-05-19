import {
  Controller,
  Get,
  Headers,
  Param,
  Res,
  UseFilters,
} from '@nestjs/common';
import { ResolverService } from './resolver.service';
import { Response } from 'express';
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { ErrorResponse } from 'lib/share/common/dto/error-response.dto';
import { ResolverSuccessResponse } from './dto/success-response.dto';
import { ExternalServiceExceptinsFilter } from 'lib/httpclient/filters/external-exceptions.filter';

@Controller('resolve')
@Controller()
@UseFilters(ExternalServiceExceptinsFilter)
export class ResolverController {
  constructor(private readonly resolverService: ResolverService) {}
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
  async handleGetUniversalResol(
    @Param('did') did: string,
    @Headers('Accept') accept: string,
    @Res() res: Response,
  ): Promise<any> {
    const { content, didDocument } =
      await this.resolverService.getDidDocumentFromUniversalResolver(
        did,
        accept,
      );
    res.setHeader('Content-Type', content);
    return res.send(didDocument);
  }
}
