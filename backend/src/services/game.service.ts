import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParticipantAnswer } from '../entities/participant-answer.entity';
import { SubmitAnswerDto } from '../dto/submit-answer.dto';
import { ParticipantService } from './participant.service';
import { QuestionService } from './question.service';
import { VotingService } from './voting.service';
import { GameGateway } from '../gateways/game.gateway';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(ParticipantAnswer)
    private answerRepository: Repository<ParticipantAnswer>,
    private participantService: ParticipantService,
    private questionService: QuestionService,
    @Inject(forwardRef(() => VotingService))
    private votingService: VotingService,
    @Inject(forwardRef(() => GameGateway))
    private gameGateway: GameGateway,
  ) {}

  async submitAnswer(submitAnswerDto: SubmitAnswerDto): Promise<{
    success: boolean;
    isCorrect: boolean;
    points: number;
    message: string;
  }> {
    const { participantId, questionId, selectedAnswer, password } = submitAnswerDto;

    // Validate participant password
    const isPasswordValid = await this.participantService.validatePassword(participantId, password);
    if (!isPasswordValid) {
      return {
        success: false,
        isCorrect: false,
        points: 0,
        message: 'Invalid password',
      };
    }

    // Check if participant has already answered this question
    const existingAnswer = await this.answerRepository.findOne({
      where: { participantId, questionId },
    });

    if (existingAnswer) {
      return {
        success: false,
        isCorrect: false,
        points: 0,
        message: 'You have already answered this question',
      };
    }

    // Check if the answer is correct
    const { isCorrect, points } = await this.questionService.checkAnswer(questionId, selectedAnswer);

    // Save the answer
    const answer = this.answerRepository.create({
      participantId,
      questionId,
      selectedAnswer,
      isCorrect,
    });
    await this.answerRepository.save(answer);

    // Update participant score if correct
    if (isCorrect) {
      await this.participantService.updateScore(participantId, points);
    }

    const result = {
      success: true,
      isCorrect,
      points,
      message: isCorrect ? 'Correct answer!' : 'Incorrect answer',
    };

    // Notify via WebSocket
    await this.gameGateway.notifyAnswerSubmitted(participantId, result);

    // Check if all questions are answered and detect ties
    await this.checkGameCompletionAndTies();

    return result;
  }

  async getParticipantAnswers(participantId: string): Promise<ParticipantAnswer[]> {
    return this.answerRepository.find({
      where: { participantId },
      relations: ['question'],
      order: { answeredAt: 'DESC' },
    });
  }

  private async checkGameCompletionAndTies(): Promise<void> {
    try {
      // Get all questions and all participants
      const allQuestions = await this.questionService.findAll();
      const allParticipants = await this.participantService.getLeaderboard();
      
      if (allQuestions.length === 0 || allParticipants.length === 0) {
        return;
      }

      // Check if all participants have answered all questions
      const totalAnswersNeeded = allQuestions.length * allParticipants.length;
      const totalAnswersGiven = await this.answerRepository.count();
      
      if (totalAnswersGiven >= totalAnswersNeeded) {
        // All questions answered, check for ties
        console.log('All questions answered, checking for ties...');
        await this.votingService.detectTieAndCreateVotingSession();
      }
    } catch (error) {
      console.error('Error checking game completion and ties:', error);
    }
  }
} 