import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Participant } from './participant.entity';
import { Question } from './question.entity';

@Entity('participant_answers')
@Unique(['participantId', 'questionId'])
export class ParticipantAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'participant_id' })
  participantId: string;

  @Column({ type: 'uuid', name: 'question_id' })
  questionId: string;

  @Column({ type: 'varchar', length: 255, name: 'selected_answer' })
  selectedAnswer: string;

  @Column({ type: 'boolean', name: 'is_correct' })
  isCorrect: boolean;

  @CreateDateColumn({ name: 'answered_at' })
  answeredAt: Date;

  @ManyToOne(() => Participant, participant => participant.answers)
  @JoinColumn({ name: 'participant_id' })
  participant: Participant;

  @ManyToOne(() => Question, question => question.answers)
  @JoinColumn({ name: 'question_id' })
  question: Question;
} 