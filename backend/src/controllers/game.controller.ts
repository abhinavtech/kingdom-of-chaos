import { Controller, Post, Body, Get, Param, ValidationPipe } from '@nestjs/common';
import { GameService } from '../services/game.service';
import { SubmitAnswerDto } from '../dto/submit-answer.dto';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('submit-answer')
  submitAnswer(@Body(ValidationPipe) submitAnswerDto: SubmitAnswerDto) {
    return this.gameService.submitAnswer(submitAnswerDto);
  }

  @Get('participant/:id/answers')
  getParticipantAnswers(@Param('id') participantId: string) {
    return this.gameService.getParticipantAnswers(participantId);
  }
} 