import { IsNotEmpty, IsString } from 'class-validator';
export class SubjectDidRegistrationDto {
  @IsNotEmpty()
  @IsString()
  subjectDid: string;
}
