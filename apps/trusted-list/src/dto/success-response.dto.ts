import { ApiProperty } from '@nestjs/swagger';

class ServiceMetadata {
  @ApiProperty({ description: 'サービス名' })
  serviceName: string;
  @ApiProperty({ description: 'サービスバージョン' })
  version: string;
  @ApiProperty({ description: '応答時間' })
  timestamp: string;
  @ApiProperty({ description: '処理時間' })
  processingTimeMillis: string;
  @ApiProperty({ description: 'IPFS URL' })
  ipfsGatewayUrl: 'IPFS GATEWAY URL';
  @ApiProperty({ description: 'IPFS CID' })
  fetchedCid: 'QmWgb43fohgmnGVEKNtfqCUfpFi4zudjsieUkY4iJzaW8c';
}
class DeleteServiceMetadata {
  @ApiProperty({ description: 'サービス名' })
  serviceName: string;
  @ApiProperty({ description: 'サービスバージョン' })
  version: string;
  @ApiProperty({ description: '応答時間' })
  timestamp: string;
  @ApiProperty({ description: '処理時間' })
  processingTimeMillis: string;
}
class GetTrustedIssuer {
  @ApiProperty({
    description: '発行者のDID',
    example: 'did:key:z6Mkiq1TQyWPezBTGoqNvcq9b6azWMyn6HwQmbjo5LLpai68',
  })
  trustedIssuer: string;
  @ApiProperty({
    description: '状態コード',
    examples: [
      { value: 'no-trusted', description: '信頼されていない' },
      { value: 'trusted', description: '信頼されている' },
    ],
  })
  status: string;
  @ApiProperty({
    description: '有効期限',
    example: '2025-05-10T12:01:04.828Z',
  })
  validUntil: string;
}
export class GetResponse {
  @ApiProperty({ description: 'ペイロード' })
  payload: GetTrustedIssuer;
  @ApiProperty({ required: false, description: 'サービスメタ情報' })
  serviceMetadata: ServiceMetadata;
}
class AddOrPutTrustedIssuer {
  @ApiProperty({
    description: '発行者のDID',
    example: 'did:key:z6Mkiq1TQyWPezBTGoqNvcq9b6azWMyn6HwQmbjo5LLpai68',
  })
  trustedIssuer: string;
}
export class AddOrPutResponse {
  @ApiProperty({ description: 'ペイロード' })
  payload: AddOrPutTrustedIssuer;
  @ApiProperty({ required: false, description: 'サービスメタ情報' })
  serviceMetadata: ServiceMetadata;
}
export class DeleteResponse {
  @ApiProperty({ description: 'ペイロード' })
  payload: AddOrPutTrustedIssuer;
  @ApiProperty({ required: false, description: 'サービスメタ情報' })
  serviceMetadata: DeleteServiceMetadata;
}
