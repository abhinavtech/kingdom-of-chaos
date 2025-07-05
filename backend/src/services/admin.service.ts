import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminLoginDto } from '../dto/admin-login.dto';
import { Participant } from '../entities/participant.entity';
import { ParticipantAnswer } from '../entities/participant-answer.entity';
import { Question } from '../entities/question.entity';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AdminService {
  private readonly adminPassword = 'biggestlulli69';
  private readonly jwtSecret = 'kingdom-of-chaos-admin-secret-key';

  constructor(
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
    @InjectRepository(ParticipantAnswer)
    private participantAnswerRepository: Repository<ParticipantAnswer>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  async login(adminLoginDto: AdminLoginDto): Promise<{ success: boolean; token?: string; message?: string }> {
    const { password } = adminLoginDto;

    if (password !== this.adminPassword) {
      return {
        success: false,
        message: 'Invalid password. Access denied.',
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        role: 'admin', 
        timestamp: Date.now() 
      },
      this.jwtSecret,
      { expiresIn: '24h' }
    );

    return {
      success: true,
      token,
      message: 'Authentication successful',
    };
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      return decoded.role === 'admin';
    } catch (error) {
      return false;
    }
  }

  async deleteAllUsers(): Promise<{ message: string; deletedParticipants: number; deletedAnswers: number }> {
    try {
      // Get counts before deletion
      const participantsCount = await this.participantRepository.count();
      const answersCount = await this.participantAnswerRepository.count();
      
      // Delete all participant answers first (due to foreign key constraints)
      await this.participantAnswerRepository.query('DELETE FROM participant_answers');
      
      // Delete all participants
      await this.participantRepository.query('DELETE FROM participants');
      
      return {
        message: `Successfully deleted all users and their data.`,
        deletedParticipants: participantsCount,
        deletedAnswers: answersCount,
      };
    } catch (error) {
      console.error('Error deleting all users:', error);
      throw error;
    }
  }

  async deleteAllQuestions(): Promise<{ message: string; deletedQuestions: number; deletedAnswers: number }> {
    try {
      // Get counts before deletion
      const questionsCount = await this.questionRepository.count();
      const answersCount = await this.participantAnswerRepository.count();
      
      // Delete all participant answers first (due to foreign key constraints)
      await this.participantAnswerRepository.query('DELETE FROM participant_answers');
      
      // Delete all questions
      await this.questionRepository.query('DELETE FROM questions');
      
      return {
        message: `Successfully deleted all questions and related data.`,
        deletedQuestions: questionsCount,
        deletedAnswers: answersCount,
      };
    } catch (error) {
      console.error('Error deleting all questions:', error);
      throw error;
    }
  }

  async addQuestions(questions: Array<{
    questionText: string;
    options: Record<string, string>;
    correctAnswer: string;
    points?: number;
  }>): Promise<{ message: string; questionsAdded: number }> {
    try {
      const questionEntities = questions.map((q, index) => ({
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points || 10,
        isActive: index === 0, // Only the first question is active
      }));

      const savedQuestions = await this.questionRepository.save(questionEntities);
      
      return {
        message: `Successfully added ${savedQuestions.length} questions.`,
        questionsAdded: savedQuestions.length,
      };
    } catch (error) {
      console.error('Error adding questions:', error);
      throw error;
    }
  }
} 