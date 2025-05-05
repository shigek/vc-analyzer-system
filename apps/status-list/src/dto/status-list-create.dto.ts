import { IsNumber } from 'class-validator';

export class StatusListCreateDto {
  @IsNumber()
  credentials: number;
}
