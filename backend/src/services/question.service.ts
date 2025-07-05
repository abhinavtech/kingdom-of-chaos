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
    // Find the first question by creation date
    const firstQuestion = await this.questionRepository.findOne({
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

  async resetAllQuestions(): Promise<{ message: string; questionsReset: number }> {
    try {
      // Get all questions
      const allQuestions = await this.questionRepository.find();
      
      // Update all questions to inactive, then activate the first one
      await this.questionRepository.query(
        'UPDATE questions SET is_active = false'
      );
      
      // Activate only the first question
      const firstQuestion = await this.questionRepository.findOne({
        where: {},
        order: { createdAt: 'ASC' },
      });
      
      if (firstQuestion) {
        await this.questionRepository.query(
          'UPDATE questions SET is_active = true WHERE id = $1',
          [firstQuestion.id]
        );
      }
      
      return {
        message: 'All questions have been reset. Only the first question is now active.',
        questionsReset: allQuestions.length,
      };
    } catch (error) {
      console.error('Error resetting questions:', error);
      throw error;
    }
  }
} 