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
class GetOrPutStatusIssuer {
  @ApiProperty({
    description: 'リストID',
    example: 'urn:d8290d62-813d-44a9-98d3-fd27c85f729b',
  })
  listId: string;
  @ApiProperty({ description: 'インデックス', example: '123' })
  index: string;
}
class GetOrPutPayloadLoad {
  @ApiProperty({ description: '発行者のステータスリスト情報' })
  statusIssuer: GetOrPutStatusIssuer;
  @ApiProperty({
    description: '状態コード',
    examples: [
      { value: 'revoked', description: '失効' },
      { value: 'valid', description: '正常' },
    ],
  })
  status: string;
}
export class GetOrPutResponse {
  @ApiProperty({ description: 'ペイロード' })
  payload: GetOrPutPayloadLoad;
  @ApiProperty({ required: false, description: 'サービスメタ情報' })
  serviceMetadata: ServiceMetadata;
}
class AddStatusIssuer {
  @ApiProperty({
    description: 'リストID',
    example: 'urn:d8290d62-813d-44a9-98d3-fd27c85f729b',
  })
  listId: string;
}
class AddPayloadLoad {
  @ApiProperty({ description: '発行者のステータスリスト情報' })
  statusIssuer: AddStatusIssuer;
  @ApiProperty({
    description: '状態コード',
    examples: [
      { value: 'revoked', description: '失効' },
      { value: 'valid', description: '正常' },
    ],
  })
  status: string;
}
export class AddResponse {
  @ApiProperty({ description: 'ペイロード' })
  payload: AddPayloadLoad;
  @ApiProperty({ required: false, description: 'サービスメタ情報' })
  serviceMetadata: ServiceMetadata;
}
