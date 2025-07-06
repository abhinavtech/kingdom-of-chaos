import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VotingSession } from '../entities/voting-session.entity';
import { Vote } from '../entities/vote.entity';
import { Participant } from '../entities/participant.entity';
import { ParticipantService } from './participant.service';
import { GameGateway } from '../gateways/game.gateway';

@Injectable()
export class VotingService {
  constructor(
    @InjectRepository(VotingSession)
    private votingSessionRepository: Repository<VotingSession>,
    @InjectRepository(Vote)
    private voteRepository: Repository<Vote>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
    private participantService: ParticipantService,
    @Inject(forwardRef(() => GameGateway))
    private gameGateway: GameGateway,
  ) {}

  async detectTieAndCreateVotingSession(): Promise<VotingSession | null> {
    const leaderboard = await this.participantService.getLeaderboard();
    
    if (leaderboard.length < 2) {
      return null; // No tie possible with less than 2 participants
    }

    // Find the highest score
    const highestScore = leaderboard[0].score;
    
    // Find all participants with the highest score
    const tiedParticipants = leaderboard.filter(p => p.score === highestScore);
    
    if (tiedParticipants.length < 2) {
      return null; // No tie
    }

    // Check if there's already an active voting session for this tie
    const existingSession = await this.votingSessionRepository.findOne({
      where: { 
        status: 'active',
        tiedScore: highestScore,
      }
    });

    if (existingSession) {
      return existingSession; // Return existing session
    }

    // Create new voting session
    const votingSession = this.votingSessionRepository.create({
      tiedParticipants: tiedParticipants.map(p => p.id),
      tiedScore: highestScore,
      status: 'active',
      votingTimeInSeconds: 60,
      votingEndsAt: new Date(Date.now() + 60 * 1000), // 60 seconds from now
    });

    const savedSession = await this.votingSessionRepository.save(votingSession);
    
    // Broadcast voting session to all participants
    await this.gameGateway.broadcastVotingSessionStarted(savedSession, tiedParticipants);
    
    // Set a timeout to automatically end the voting session
    setTimeout(() => {
      this.endVotingSession(savedSession.id);
    }, 60 * 1000);

    return savedSession;
  }

  async submitVote(votingSessionId: string, voterParticipantId: string, targetParticipantId: string, password: string): Promise<{
    success: boolean;
    message: string;
  }> {
    // Validate voter password
    const isPasswordValid = await this.participantService.validatePassword(voterParticipantId, password);
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid password' };
    }

    // Check if voting session exists and is active
    const votingSession = await this.votingSessionRepository.findOne({
      where: { id: votingSessionId, status: 'active' },
    });

    if (!votingSession) {
      return { success: false, message: 'Voting session not found or has ended' };
    }

    // Check if voting has expired
    if (new Date() > votingSession.votingEndsAt) {
      return { success: false, message: 'Voting time has expired' };
    }

    // Check if voter is one of the tied participants
    if (!votingSession.tiedParticipants.includes(voterParticipantId)) {
      return { success: false, message: 'You are not eligible to vote in this session' };
    }

    // Check if target is one of the tied participants
    if (!votingSession.tiedParticipants.includes(targetParticipantId)) {
      return { success: false, message: 'Invalid vote target' };
    }

    // Check if voter has already voted
    const existingVote = await this.voteRepository.findOne({
      where: { 
        votingSessionId, 
        voterParticipantId 
      },
    });

    if (existingVote) {
      // Update existing vote
      existingVote.targetParticipantId = targetParticipantId;
      await this.voteRepository.save(existingVote);
    } else {
      // Create new vote
      const vote = this.voteRepository.create({
        votingSessionId,
        voterParticipantId,
        targetParticipantId,
      });
      await this.voteRepository.save(vote);
    }

    // Broadcast vote update
    await this.gameGateway.broadcastVoteUpdate(votingSessionId);

    return { success: true, message: 'Vote submitted successfully' };
  }

  async getVotingSession(sessionId: string): Promise<VotingSession | null> {
    return this.votingSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['votes'],
    });
  }

  async getActiveVotingSession(): Promise<VotingSession | null> {
    return this.votingSessionRepository.findOne({
      where: { status: 'active' },
      relations: ['votes'],
    });
  }

  async getVotingResults(sessionId: string): Promise<{
    votingSession: VotingSession;
    voteCount: { [participantId: string]: number };
    totalVotes: number;
    eliminatedParticipant: Participant | null;
  }> {
    const votingSession = await this.votingSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['votes'],
    });

    if (!votingSession) {
      throw new Error('Voting session not found');
    }

    // Count votes for each participant
    const voteCount: { [participantId: string]: number } = {};
    votingSession.tiedParticipants.forEach(participantId => {
      voteCount[participantId] = 0;
    });

    votingSession.votes.forEach(vote => {
      voteCount[vote.targetParticipantId] = (voteCount[vote.targetParticipantId] || 0) + 1;
    });

    const totalVotes = votingSession.votes.length;

    // Find participant with most votes (to be eliminated)
    let eliminatedParticipant: Participant | null = null;
    let maxVotes = 0;
    
    for (const participantId in voteCount) {
      if (voteCount[participantId] > maxVotes) {
        maxVotes = voteCount[participantId];
        eliminatedParticipant = await this.participantRepository.findOne({
          where: { id: participantId }
        });
      }
    }

    return {
      votingSession,
      voteCount,
      totalVotes,
      eliminatedParticipant,
    };
  }

  async endVotingSession(sessionId: string): Promise<void> {
    const votingSession = await this.votingSessionRepository.findOne({
      where: { id: sessionId, status: 'active' },
    });

    if (!votingSession) {
      return; // Session not found or already ended
    }

    const results = await this.getVotingResults(sessionId);
    
    // Update voting session status
    votingSession.status = 'completed';
    votingSession.eliminatedParticipantId = results.eliminatedParticipant?.id || null;
    await this.votingSessionRepository.save(votingSession);

    // If someone was eliminated, reduce their score to ensure they're no longer tied
    if (results.eliminatedParticipant) {
      await this.participantRepository.update(
        { id: results.eliminatedParticipant.id },
        { score: results.eliminatedParticipant.score - 1 }
      );
    }

    // Broadcast voting results
    await this.gameGateway.broadcastVotingSessionEnded(sessionId, results);
  }

  async getAllVotingSessions(): Promise<VotingSession[]> {
    return this.votingSessionRepository.find({
      relations: ['votes'],
      order: { createdAt: 'DESC' },
    });
  }

  async cancelVotingSession(sessionId: string): Promise<void> {
    await this.votingSessionRepository.update(
      { id: sessionId },
      { status: 'cancelled' }
    );
    
    await this.gameGateway.broadcastVotingSessionCancelled(sessionId);
  }
} 