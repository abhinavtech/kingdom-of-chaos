import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { ParticipantAnswer } from './participant-answer.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', name: 'question_text' })
  questionText: string;

  @Column({ type: 'jsonb' })
  options: Record<string, string>;

  @Column({ type: 'varchar', length: 255, name: 'correct_answer' })
  correctAnswer: string;

  @Column({ type: 'int', default: 10 })
  points: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => ParticipantAnswer, answer => answer.question)
  answers: ParticipantAnswer[];
} 