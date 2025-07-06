import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { VotingSession } from './voting-session.entity';
import { Participant } from './participant.entity';

@Entity('votes')
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  votingSessionId: string;

  @Column({ type: 'varchar' })
  voterParticipantId: string; // ID of participant who is voting

  @Column({ type: 'varchar' })
  targetParticipantId: string; // ID of participant being voted for elimination

  @ManyToOne(() => VotingSession, votingSession => votingSession.votes)
  @JoinColumn({ name: 'votingSessionId' })
  votingSession: VotingSession;

  @ManyToOne(() => Participant)
  @JoinColumn({ name: 'voterParticipantId' })
  voter: Participant;

  @ManyToOne(() => Participant)
  @JoinColumn({ name: 'targetParticipantId' })
  target: Participant;

  @CreateDateColumn()
  createdAt: Date;
} 