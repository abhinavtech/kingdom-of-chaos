import { Controller, Get, Param, Post } from '@nestjs/common';
import { QuestionService } from '../services/question.service';
import { GameGateway } from '../gateways/game.gateway';

@Controller('questions')
export class QuestionController {
  constructor(
    private readonly questionService: QuestionService,
    private readonly gameGateway: GameGateway,
  ) {}

  @Get()
  findAll() {
    return this.questionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionService.findOne(id);
  }

  @Post('release-next')
  async releaseNext() {
    const question = await this.questionService.releaseNextQuestion();
    if (question) {
      await this.gameGateway.broadcastQuestionReleased(question);
      return { success: true, question };
    } else {
      return { success: false, message: 'No more questions to release' };
    }
  }
} 