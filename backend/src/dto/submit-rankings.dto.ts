import { IsString, IsArray, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RankingDto {
  @IsString()
  participantId: string;

  @IsInt()
  @Min(1)
  rank: number;
}

export class SubmitRankingsDto {
  @IsString()
  pollId: string;

  @IsString()
  rankerParticipantId: string;

  @IsString()
  password: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RankingDto)
  rankings: RankingDto[];
}