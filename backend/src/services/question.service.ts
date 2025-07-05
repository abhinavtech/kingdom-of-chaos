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
} 