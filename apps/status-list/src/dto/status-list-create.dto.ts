import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class StatusListCreateDto {
  @ApiProperty({ example: '1000' })
  @IsNumber()
  @Min(2)
  credentials: number;
}
