import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
export class StatusListUpdateDto {
  @ApiProperty({ example: 'revoked' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['revoked', 'valid'])
  status: string;
}
