import { ApiProperty } from '@nestjs/swagger';

export class ServiceMetadata {
  @ApiProperty({ description: 'エラーメッセージ' })
  serviceName: string;
  @ApiProperty({ description: 'エラーコード' })
  version: string;
  @ApiProperty({ required: false, description: 'エラー詳細' })
  timestamp: string;
  @ApiProperty({ description: '処理識別子' })
  processingTimeMillis: string;
  @ApiProperty({ description: '処理識別子' })
  correlationId: string;
}
export class ServiceErrorMainResponse {
  @ApiProperty({ description: 'エラーメッセージ' })
  message: string;
  @ApiProperty({ description: 'エラーコード' })
  code: string;
  @ApiProperty({ required: false, description: 'エラー詳細', isArray: true })
  details: object;
}
export class ServiceErrorResponse {
  @ApiProperty({ description: 'サービスエラー' })
  error: ServiceErrorMainResponse;
  @ApiProperty({ required: false, description: 'サービスメタ情報' })
  serviceMetadata: ServiceMetadata;
}
export class ErrorResponse {
  @ApiProperty({ description: 'エラーメッセージ' })
  message: string;
  @ApiProperty({ description: 'エラーコード' })
  code: string;
  @ApiProperty({ required: false, description: 'エラー詳細' })
  details?: object;
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
