import { IsNotEmpty, IsString } from 'class-validator';
export class SubjectDidDeleteDto {
  @IsNotEmpty()
  @IsString()
  subjectDid: string;
}
