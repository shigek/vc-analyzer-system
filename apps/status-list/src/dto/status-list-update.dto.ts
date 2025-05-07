import { IsIn, IsNotEmpty, IsString } from 'class-validator';
export class StatusListUpdateDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['revoked', 'valid'])
  status: string;
}
