import { ApiProperty } from '@nestjs/swagger';

class ErrorServiceMetadata {
  @ApiProperty({ description: 'サービス名' })
  serviceName: string;
  @ApiProperty({ description: 'サービスバージョン' })
  version: string;
  @ApiProperty({ description: '応答時間' })
  timestamp: string;
  @ApiProperty({ description: '処理時間' })
  processingTimeMillis: string;
  @ApiProperty({ description: '処理識別子' })
  correlationId: string;
}
class ErrorMainResponse {
  @ApiProperty({ description: 'エラーメッセージ' })
  message: string;
  @ApiProperty({ description: 'エラーコード' })
  code: string;
  @ApiProperty({ required: false, description: 'エラー詳細', isArray: true })
  details: object;
}
export class ErrorResponse {
  @ApiProperty({ description: 'サービスエラー' })
  error: ErrorMainResponse;
  @ApiProperty({ required: false, description: 'サービスメタ情報' })
  serviceMetadata: ErrorServiceMetadata;
}
