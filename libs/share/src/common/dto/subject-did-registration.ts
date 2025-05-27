import { ApiProperty } from '@nestjs/swagger';
import { IsDidFormat } from 'lib/share/common/helpers/validator/custom-validator';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class SubjectDidRegistrationDto {
  @ApiProperty({
    description: '登録者のDID',
    required: true,
    example: 'did:key:z6Mkiq1TQyWPezBTGoqNvcq9b6azWMyn6HwQmbjo5LLpai68',
  })
  @IsNotEmpty()
  @IsString()
  @IsDidFormat()
  subjectDid: string;

  @ApiProperty({ description: '未サポート', required: false })
  @IsOptional()
  policy?: any;
}
