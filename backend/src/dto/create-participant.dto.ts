import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateParticipantDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;
} 