import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class StatusListCreateDto {
  @ApiProperty({ example: '1000' })
  @IsNumber()
  @Min(2)
  size: number;

  @ApiProperty({
    example: 'revocation',
    required: false,
    description: '省略時は、`revocation`',
  })
  @IsString()
  @IsOptional()
  @IsIn(['revocation', 'suspension', 'message'])
  statusPurpose?: string;

  @ApiProperty({
    example: 0,
    required: false,
    description:
      '`{specName}` が "bitstring" の場合で、statusPurposeがmessageの時のみ必須 (1, 2, 3)。',
  })
  @IsOptional()
  @IsNumber()
  @IsIn([1, 2, 3])
  bits?: number;

  @ApiProperty({
    example: 1,
    required: true,
    description: '`ビット値の文字列とステータス文字列の対応マップ`',
  })
  @IsOptional()
  bitMapping?: object;
}
