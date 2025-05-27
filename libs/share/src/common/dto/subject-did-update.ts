import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';
export class SubjectDidUpdateDto {
  @ApiProperty({
    required: false,
    description: 'ISO 8601フォーマット',
    example: '2024-11-03T01:23:56.789Z',
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  policy?: any;
}
