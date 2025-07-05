import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SubmitAnswerDto {
  @IsNotEmpty()
  @IsUUID()
  participantId: string;

  @IsNotEmpty()
  @IsUUID()
  questionId: string;

  @IsNotEmpty()
  @IsString()
  selectedAnswer: string;

  @IsNotEmpty()
  @IsString()
  password: string;
} 