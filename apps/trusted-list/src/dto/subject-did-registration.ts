import { IsDidFormat } from '@share/share/common/helpers/validator/custom-validator';
import { IsNotEmpty, IsString } from 'class-validator';
export class SubjectDidRegistrationDto {
  @IsNotEmpty()
  @IsString()
  @IsDidFormat()
  subjectDid: string;
}
