import { ApiProperty } from '@nestjs/swagger';
class ServiceError {
  @ApiProperty({ description: 'エラーメッセージ' })
  error: object;
  @ApiProperty({ description: 'サービスメタ情報' })
  serviceMetaData: object;
}
class ErrorServiceMetadata {
  @ApiProperty({ description: 'サービス名' })
  serviceName: string;
  @ApiProperty({ description: 'バージョン情報' })
  version: string;
  @ApiProperty({ required: false, description: '応答時間' })
  timestamp: string;
  @ApiProperty({ description: '処理時間' })
  processingTimeMillis: string;
  @ApiProperty({ description: '処理識別子' })
  correlationId: string;
}
class ExternalServiceErrorResponse {
  @ApiProperty({ description: 'エラーメッセージ' })
  message: string;
  @ApiProperty({ description: 'エラーコード' })
  code: string;
  @ApiProperty({ description: '外部連携エラー情報' })
  serviceError: ServiceError;
  @ApiProperty({ description: 'サービスメタ情報' })
  serviceMetaData: ErrorServiceMetadata;
}
class ErrorDetail {
  @ApiProperty({ description: 'エラーメッセージ' })
  message: string;
  @ApiProperty({ description: 'エラーコード' })
  code: string;
  @ApiProperty({ description: 'サービス連携エラー情報' })
  externalServiceError: ExternalServiceErrorResponse;
  @ApiProperty({ description: 'エラー詳細', isArray: true })
  details: object;
}
export class ErrorResponse {
  @ApiProperty({ description: 'エラーメッセージ' })
  error: ErrorDetail;
  @ApiProperty({ description: 'サービスメタ情報' })
  serviceMetaData: ErrorServiceMetadata;
}
