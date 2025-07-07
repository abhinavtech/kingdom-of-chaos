import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PollRanking } from './poll-ranking.entity';

@Entity('polls')
export class Poll {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'int', default: 300 }) // 5 minutes default
  timeLimit: number; // Time limit in seconds

  @Column({ type: 'timestamp', nullable: true })
  pollEndsAt: Date;

  @Column({ type: 'varchar', default: 'pending' })
  status: 'pending' | 'active' | 'completed' | 'cancelled';

  @OneToMany(() => PollRanking, ranking => ranking.poll)
  rankings: PollRanking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}