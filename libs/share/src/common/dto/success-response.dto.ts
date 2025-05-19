import { ApiProperty } from '@nestjs/swagger';
import { ServiceMetadata } from 'lib/share/interfaces/response/serviceMetadata.interface';

export class ServiceMetadataDto implements ServiceMetadata {
  @ApiProperty({ description: 'サービス名' })
  serviceName: string;

  @ApiProperty({ description: 'サービスバージョン' })
  version: string;

  @ApiProperty({ description: '応答時間' })
  timestamp: string;

  @ApiProperty({ description: '処理時間' })
  processingTimeMillis: number;

  @ApiProperty({ description: 'IPFS URL(オプション）', required: false })
  verifableCredentialUrl?: 'VC 取得 URL';

  @ApiProperty({ description: 'IPFS CID（オプション）', required: false })
  fetchedCid?: 'QmWgb43fohgmnGVEKNtfqCUfpFi4zudjsieUkY4iJzaW8c';

  @ApiProperty({ description: 'IPFS CID（オプション）', required: false })
  createdCid?: 'QmWgb43fohgmnGVEKNtfqCUfpFi4zudjsieUkY4iJzaW8c';
}
