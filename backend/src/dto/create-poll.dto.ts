import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreatePollDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(60) // Minimum 1 minute
  timeLimit?: number;
}