import { ApiProperty } from '@nestjs/swagger';
import { AxiosError } from 'axios';
export class ErrorResponse {
  @ApiProperty({ description: 'エラーメッセージ' })
  message: string;
  @ApiProperty({ description: 'エラーコード' })
  code: string;
  @ApiProperty({ required: false, description: 'エラー詳細' })
  details?: AxiosError['message'];
  @ApiProperty({ description: '処理識別子' })
  correlationId: string;
}

export class ResolverErrorResponse {
  @ApiProperty({ description: 'DIDドキュメント（JSON表現）' })
  didDocument: object;
  @ApiProperty({ description: 'DID 解決メタデータ', additionalProperties: {} })
  didResolutionMetadata: object;
  @ApiProperty({ description: 'DID 共通メタデータ', additionalProperties: {} })
  didDocumentMetadata: object;
}
export class ExternalServiceErrorResponse {
  @ApiProperty({ description: 'エラーメッセージ' })
  message: string;
  @ApiProperty({ description: 'エラーコード' })
  code: string;
  @ApiProperty({ description: '外部サービス連携エラー情報' })
  serviceError: ResolverErrorResponse;
  @ApiProperty({ description: '処理識別子' })
  correlationId: string;
}
