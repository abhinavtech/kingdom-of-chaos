import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../entities/question.entity';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  async findAll(): Promise<Question[]> {
    return this.questionRepository.find({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findAllQuestions(): Promise<Question[]> {
    return this.questionRepository.find({
      order: { createdAt: 'ASC' },
    });
  }

  async ensureFirstQuestionActive(): Promise<void> {
    const firstQuestion = await this.questionRepository.findOne({
      where: {},
      order: { createdAt: 'ASC' },
    });
    
    if (firstQuestion && !firstQuestion.isActive) {
      firstQuestion.isActive = true;
      await this.questionRepository.save(firstQuestion);
    }
  }

  async findOne(id: string): Promise<Question> {
    return this.questionRepository.findOne({
      where: { id, isActive: true },
    });
  }

  async checkAnswer(questionId: string, selectedAnswer: string): Promise<{ isCorrect: boolean; points: number }> {
    const question = await this.findOne(questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    const isCorrect = question.correctAnswer === selectedAnswer;
    return {
      isCorrect,
      points: isCorrect ? question.points : 0,
    };
  }

  async releaseNextQuestion(): Promise<Question | null> {
    // Find the next unreleased question
    const nextQuestion = await this.questionRepository.findOne({
      where: { isActive: false },
      order: { createdAt: 'ASC' },
    });
    
    if (!nextQuestion) return null;
    
    nextQuestion.isActive = true;
    await this.questionRepository.save(nextQuestion);
    return nextQuestion;
  }
} 