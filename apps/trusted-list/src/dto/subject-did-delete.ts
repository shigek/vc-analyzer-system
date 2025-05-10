import { ApiProperty } from '@nestjs/swagger';
import { IsDidFormat } from '@share/share/common/helpers/validator/custom-validator';
import { IsNotEmpty, IsString } from 'class-validator';
export class SubjectDidDeleteDto {
  @ApiProperty({ required: true, example: 'did:key:abc' })
  @IsNotEmpty()
  @IsString()
  @IsDidFormat()
  subjectDid: string;
}
