import { ApiProperty } from '@nestjs/swagger';
import { IsDidFormat } from '@share/share/common/helpers/validator/custom-validator';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class SubjectDidRegistrationDto {
  @ApiProperty({ required: true, example: 'did:key:abc' })
  @IsNotEmpty()
  @IsString()
  @IsDidFormat()
  subjectDid: string;

  @ApiProperty({ required: false })
  @IsOptional()
  policy?: any;
}
