import { ApiProperty } from '@nestjs/swagger';
import { ServiceMetadataDto } from 'lib/share/common/dto/success-response.dto';

export class StatusListResponse {
  @ApiProperty({ description: '作成、更新または確認対象のリスト識別子' })
  listId: string;

  @ApiProperty({ description: '確認対象のインデックス', required: false })
  index?: number;

  @ApiProperty({
    description: '指定インデックスの現在のステータス文字列',
    required: false,
  })
  status?: string;

  @ApiProperty({
    description: '指定インデックスの現在のビット値',
    required: false,
  })
  bitValue?: number;

  @ApiProperty({
    description: '更新されたインデックスのビット値',
    required: false,
  })
  newBitValue?: number;

  @ApiProperty({
    description: '更新後の新しいステータス文字列',
    required: false,
  })
  newStatus?: string;

  @ApiProperty({ description: '成功メッセージ', required: false })
  message: string;
}
export class StatusListSuccessResponse {
  @ApiProperty({ description: 'ペイロード' })
  payload: StatusListResponse;
  @ApiProperty({ required: false, description: 'サービスメタ情報' })
  serviceMetadata: ServiceMetadataDto;
}
