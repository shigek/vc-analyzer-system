import { IsNotEmpty, IsString } from 'class-validator';
export class StatusListUpdateDto {
  @IsString()
  @IsNotEmpty()
  status: string;
}
