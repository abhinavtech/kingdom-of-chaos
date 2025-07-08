import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Poll } from './poll.entity';
import { Participant } from './participant.entity';

@Entity('poll_rankings')
export class PollRanking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  pollId: string;

  @Column({ type: 'varchar' })
  rankerParticipantId: string; // ID of participant who is doing the ranking

  @Column({ type: 'varchar' })
  rankedParticipantId: string; // ID of participant being ranked

  @Column({ type: 'int' })
  rank: number; // 1 = best, higher numbers = worse

  @ManyToOne(() => Poll, poll => poll.rankings)
  @JoinColumn({ name: 'pollId' })
  poll: Poll;

  @ManyToOne(() => Participant)
  @JoinColumn({ name: 'rankerParticipantId' })
  ranker: Participant;

  @ManyToOne(() => Participant)
  @JoinColumn({ name: 'rankedParticipantId' })
  ranked: Participant;

  @CreateDateColumn()
  createdAt: Date;
}