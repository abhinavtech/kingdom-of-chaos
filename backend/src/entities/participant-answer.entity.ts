import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Participant } from './participant.entity';
import { Question } from './question.entity';

@Entity('participant_answers')
@Unique(['participantId', 'questionId'])
export class ParticipantAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  participantId: string;

  @Column({ type: 'uuid' })
  questionId: string;

  @Column({ type: 'varchar', length: 255 })
  selectedAnswer: string;

  @Column({ type: 'boolean' })
  isCorrect: boolean;

  @CreateDateColumn()
  answeredAt: Date;

  @ManyToOne(() => Participant, participant => participant.answers)
  @JoinColumn({ name: 'participantId' })
  participant: Participant;

  @ManyToOne(() => Question, question => question.answers)
  @JoinColumn({ name: 'questionId' })
  question: Question;
} 