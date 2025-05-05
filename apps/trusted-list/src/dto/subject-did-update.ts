import { IsOptional, IsDateString } from 'class-validator';
export class SubjectDidUpdateDto {
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  policy?: any;
}
