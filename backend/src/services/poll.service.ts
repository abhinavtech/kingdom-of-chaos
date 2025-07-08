import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Poll } from '../entities/poll.entity';
import { PollRanking } from '../entities/poll-ranking.entity';
import { Participant } from '../entities/participant.entity';
import { CreatePollDto } from '../dto/create-poll.dto';
import { SubmitRankingsDto } from '../dto/submit-rankings.dto';
import { ParticipantService } from './participant.service';
import { GameGateway } from '../gateways/game.gateway';

@Injectable()
export class PollService {
  constructor(
    @InjectRepository(Poll)
    private pollRepository: Repository<Poll>,
    @InjectRepository(PollRanking)
    private pollRankingRepository: Repository<PollRanking>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
    private participantService: ParticipantService,
    @Inject(forwardRef(() => GameGateway))
    private gameGateway: GameGateway,
  ) {}

  async createPoll(createPollDto: CreatePollDto): Promise<Poll> {
    const poll = this.pollRepository.create({
      title: createPollDto.title,
      description: createPollDto.description,
      timeLimit: createPollDto.timeLimit || 300, // Default 5 minutes
      status: 'pending',
    });

    return await this.pollRepository.save(poll);
  }

  async activatePoll(pollId: string): Promise<Poll> {
    const poll = await this.pollRepository.findOne({ where: { id: pollId } });
    if (!poll) {
      throw new Error('Poll not found');
    }

    // Deactivate all other polls
    await this.pollRepository.update(
      { isActive: true },
      { isActive: false, status: 'completed' }
    );

    // Activate this poll
    const pollEndsAt = new Date(Date.now() + poll.timeLimit * 1000);
    poll.isActive = true;
    poll.status = 'active';
    poll.pollEndsAt = pollEndsAt;

    const savedPoll = await this.pollRepository.save(poll);

    // Broadcast poll activation
    await this.gameGateway.broadcastPollActivated(savedPoll);

    // Set timeout to automatically end the poll
    setTimeout(() => {
      this.endPoll(pollId);
    }, poll.timeLimit * 1000);

    return savedPoll;
  }

  async getActivePoll(): Promise<Poll | null> {
    return await this.pollRepository.findOne({
      where: { isActive: true, status: 'active' },
      relations: ['rankings'],
    });
  }

  async getAllPolls(): Promise<Poll[]> {
    return await this.pollRepository.find({
      relations: ['rankings'],
      order: { createdAt: 'DESC' },
    });
  }

  async submitRankings(submitRankingsDto: SubmitRankingsDto): Promise<{
    success: boolean;
    message: string;
  }> {
    const { pollId, rankerParticipantId, password, rankings } = submitRankingsDto;

    // Validate participant password
    const isPasswordValid = await this.participantService.validatePassword(
      rankerParticipantId,
      password
    );
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid password' };
    }

    // Check if poll exists and is active
    const poll = await this.pollRepository.findOne({
      where: { id: pollId, isActive: true, status: 'active' },
    });

    if (!poll) {
      return { success: false, message: 'Poll not found or has ended' };
    }

    // Check if poll has expired
    if (new Date() > poll.pollEndsAt) {
      return { success: false, message: 'Poll time has expired' };
    }

    // Check if participant is trying to rank themselves
    const rankingSelf = rankings.find(r => r.participantId === rankerParticipantId);
    if (rankingSelf) {
      return { success: false, message: 'You cannot rank yourself' };
    }

    // Get all participants to validate rankings
    const allParticipants = await this.participantService.getLeaderboard();
    const participantIds = allParticipants.map(p => p.id);

    // Validate all ranked participants exist
    for (const ranking of rankings) {
      if (!participantIds.includes(ranking.participantId)) {
        return { success: false, message: 'Invalid participant in rankings' };
      }
    }

    // Remove existing rankings from this participant for this poll
    await this.pollRankingRepository.delete({
      pollId,
      rankerParticipantId,
    });

    // Save new rankings
    const newRankings = rankings.map(ranking =>
      this.pollRankingRepository.create({
        pollId,
        rankerParticipantId,
        rankedParticipantId: ranking.participantId,
        rank: ranking.rank,
      })
    );

    await this.pollRankingRepository.save(newRankings);

    // Broadcast ranking update
    await this.gameGateway.broadcastPollRankingUpdate(pollId);

    return { success: true, message: 'Rankings submitted successfully' };
  }

  async getPollResults(pollId: string): Promise<{
    poll: Poll;
    results: { participantId: string; participantName: string; averageRank: number; totalPoints: number }[];
    eliminatedParticipants: { participantId: string; participantName: string }[];
  }> {
    const poll = await this.pollRepository.findOne({
      where: { id: pollId },
      relations: ['rankings'],
    });

    if (!poll) {
      throw new Error('Poll not found');
    }

    // Get all participants
    const participants = await this.participantService.getLeaderboard();
    const participantMap = new Map(participants.map(p => [p.id, p]));

    // Calculate results
    const results = [];
    const rankingsByParticipant = new Map<string, number[]>();

    // Group rankings by participant
    for (const ranking of poll.rankings) {
      if (!rankingsByParticipant.has(ranking.rankedParticipantId)) {
        rankingsByParticipant.set(ranking.rankedParticipantId, []);
      }
      rankingsByParticipant.get(ranking.rankedParticipantId)!.push(ranking.rank);
    }

    // Calculate average rank and total points for each participant
    for (const participant of participants) {
      const ranks = rankingsByParticipant.get(participant.id) || [];
      const averageRank = ranks.length > 0 ? ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length : 0;
      
      // Lower average rank = better performance = more points
      // Convert rank to points (inverse relationship)
      const totalPoints = averageRank > 0 ? Math.max(0, Math.round(100 - averageRank * 10)) : 0;

      results.push({
        participantId: participant.id,
        participantName: participant.name,
        averageRank,
        totalPoints,
      });
    }

    // Sort by average rank (lower is better)
    results.sort((a, b) => {
      if (a.averageRank === 0 && b.averageRank === 0) return 0;
      if (a.averageRank === 0) return 1; // No rankings = worst
      if (b.averageRank === 0) return -1;
      return a.averageRank - b.averageRank;
    });

    // Identify bottom 3 participants for elimination
    const eliminatedParticipants = results.slice(-3).map(r => ({
      participantId: r.participantId,
      participantName: r.participantName,
    }));

    return {
      poll,
      results,
      eliminatedParticipants,
    };
  }

  async endPoll(pollId: string): Promise<void> {
    const poll = await this.pollRepository.findOne({
      where: { id: pollId, isActive: true },
    });

    if (!poll) {
      return; // Poll not found or already ended
    }

    // Update poll status
    poll.isActive = false;
    poll.status = 'completed';
    await this.pollRepository.save(poll);

    // Get results
    const results = await this.getPollResults(pollId);

    // Update participant scores based on poll results
    for (const result of results.results) {
      if (result.totalPoints > 0) {
        await this.participantService.updateScore(result.participantId, result.totalPoints);
      }
    }

    // Broadcast poll end
    await this.gameGateway.broadcastPollEnded(pollId, results);
  }

  async deletePoll(pollId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Delete all rankings first
      await this.pollRankingRepository.delete({ pollId });
      
      // Delete the poll
      await this.pollRepository.delete({ id: pollId });
      
      return { success: true, message: 'Poll deleted successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to delete poll' };
    }
  }
}