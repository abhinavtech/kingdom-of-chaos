import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class ParticipantLoginDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(255)
  password: string;
} 