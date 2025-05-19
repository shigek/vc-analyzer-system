import { ApiProperty } from '@nestjs/swagger';
import { ServiceMetadataDto } from 'lib/share/common/dto/success-response.dto';

export class TrustedIssuerResponse {
  @ApiProperty({
    description: '発行者のDID 削除処理以外の場合',
    required: false,
    example: 'did:key:z6Mkiq1TQyWPezBTGoqNvcq9b6azWMyn6HwQmbjo5LLpai68',
  })
  trustedIssuer?: string;
  @ApiProperty({
    description: '発行者のDID 削除処理の場合',
    required: false,
    example: 'did:key:z6Mkiq1TQyWPezBTGoqNvcq9b6azWMyn6HwQmbjo5LLpai68',
  })
  deletedTrustedIssuer?: string;
  @ApiProperty({
    description: '状態コード（VC発行者の検証時以外は付加されない）',
    examples: [
      { value: 'no-trusted', description: '信頼されていない' },
      { value: 'trusted', description: '信頼されている' },
    ],
    required: false,
  })
  status?: string;
  @ApiProperty({
    description: '有効期限 (VC発行者の検証時以外は付加されない）',
    example: '2025-05-10T12:01:04.828Z',
    required: false,
  })
  validUntil?: string;
  @ApiProperty({ description: 'メタ情報', required: false })
  metadata?: { verifableCredentialUrl: string; fetchedCid: string };
  @ApiProperty({ description: '成功メッセージ', required: false })
  message?: string;
}
export class TrustedListSuccessResponse {
  @ApiProperty({ description: 'ペイロード' })
  payload: TrustedIssuerResponse;
  @ApiProperty({ description: 'サービスメタ情報' })
  serviceMetadata: ServiceMetadataDto;
}
