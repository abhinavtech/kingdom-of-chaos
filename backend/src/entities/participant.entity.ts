import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ParticipantAnswer } from './participant-answer.entity';

@Entity('participants')
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ParticipantAnswer, answer => answer.participant)
  answers: ParticipantAnswer[];

  // Computed property for questions answered
  get questionsAnswered(): number {
    return this.answers ? this.answers.length : 0;
  }
} 