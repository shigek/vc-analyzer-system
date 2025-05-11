import { ApiProperty } from '@nestjs/swagger';
import { IsDidFormat } from '@share/share/common/helpers/validator/custom-validator';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class SubjectDidRegistrationDto {
  @ApiProperty({
    required: true,
    example: 'did:key:z6Mkiq1TQyWPezBTGoqNvcq9b6azWMyn6HwQmbjo5LLpai68',
  })
  @IsNotEmpty()
  @IsString()
  @IsDidFormat()
  subjectDid: string;

  @ApiProperty({ required: false })
  @IsOptional()
  policy?: any;
}
