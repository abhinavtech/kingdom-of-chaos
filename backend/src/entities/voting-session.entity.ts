import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Vote } from './vote.entity';

@Entity('voting_sessions')
export class VotingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'json' })
  tiedParticipants: string[]; // Array of participant IDs who are tied

  @Column({ type: 'int' })
  tiedScore: number; // The score that caused the tie

  @Column({ type: 'varchar', default: 'active' })
  status: 'active' | 'completed' | 'cancelled';

  @Column({ type: 'varchar', nullable: true })
  eliminatedParticipantId: string; // ID of participant who was voted out

  @Column({ type: 'int', default: 60 })
  votingTimeInSeconds: number; // Time limit for voting

  @Column({ type: 'timestamp', nullable: true })
  votingEndsAt: Date;

  @OneToMany(() => Vote, vote => vote.votingSession)
  votes: Vote[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 