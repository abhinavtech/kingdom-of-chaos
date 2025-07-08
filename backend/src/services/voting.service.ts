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

  private votingTimeouts = new Map<string, NodeJS.Timeout>();

  async detectTieAndCreateVotingSession(): Promise<VotingSession | null> {
    const leaderboard = await this.participantService.getLeaderboard();
    
    if (leaderboard.length < 2) {
      return null; // No tie possible with less than 2 participants
    }

    // Find the highest score among active participants
    const highestScore = leaderboard[0].score;
    
    // Find all participants with the highest score
    const tiedParticipants = leaderboard.filter(p => p.score === highestScore && p.score > 0);
    
    if (tiedParticipants.length < 2) {
      return null; // No tie
    }

    // Check if there's already an active voting session
    const existingSession = await this.votingSessionRepository.findOne({
      where: { 
        status: 'active',
      }
    });

    if (existingSession) {
      // Cancel existing session if it's for a different tie
      if (existingSession.tiedScore !== highestScore) {
        await this.cancelVotingSession(existingSession.id);
      } else {
        return existingSession; // Return existing session for same tie
      }
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
    const timeout = setTimeout(() => {
      this.endVotingSession(savedSession.id);
    }, 60 * 1000);
    
    // Store timeout reference to allow cancellation
    this.votingTimeouts.set(savedSession.id, timeout);

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

    // Check if voter is trying to vote for themselves
    if (voterParticipantId === targetParticipantId) {
      return { success: false, message: 'You cannot vote for yourself' };
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

    // Initialize vote count for all tied participants
    const voteCount: { [participantId: string]: number } = {};
    votingSession.tiedParticipants.forEach(participantId => {
      voteCount[participantId] = 0;
    });

    // Count votes - ensure votes are loaded
    if (votingSession.votes && votingSession.votes.length > 0) {
      votingSession.votes.forEach(vote => {
        if (vote.targetParticipantId in voteCount) {
          voteCount[vote.targetParticipantId]++;
        }
      });
    }

    const totalVotes = votingSession.votes?.length || 0;

    // Find participant(s) with most votes
    let eliminatedParticipant: Participant | null = null;
    let maxVotes = 0;
    const tiedForElimination: string[] = [];
    
    for (const participantId in voteCount) {
      if (voteCount[participantId] > maxVotes) {
        maxVotes = voteCount[participantId];
        tiedForElimination.length = 0;
        tiedForElimination.push(participantId);
      } else if (voteCount[participantId] === maxVotes && maxVotes > 0) {
        tiedForElimination.push(participantId);
      }
    }

    // If there's a clear winner (loser), eliminate them
    if (tiedForElimination.length === 1 && maxVotes > 0) {
      eliminatedParticipant = await this.participantRepository.findOne({
        where: { id: tiedForElimination[0] }
      });
    } else if (tiedForElimination.length > 1) {
      // In case of tie in elimination votes, randomly select one
      const randomIndex = Math.floor(Math.random() * tiedForElimination.length);
      eliminatedParticipant = await this.participantRepository.findOne({
        where: { id: tiedForElimination[randomIndex] }
      });
    }

    return {
      votingSession,
      voteCount,
      totalVotes,
      eliminatedParticipant,
    };
  }

  async endVotingSession(sessionId: string): Promise<void> {
    // Clear any existing timeout
    const timeout = this.votingTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.votingTimeouts.delete(sessionId);
    }

    const votingSession = await this.votingSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['votes'],
    });

    if (!votingSession || votingSession.status !== 'active') {
      return; // Session not found or already ended
    }

    try {
      const results = await this.getVotingResults(sessionId);
      
      // Update voting session status
      votingSession.status = 'completed';
      votingSession.eliminatedParticipantId = results.eliminatedParticipant?.id || null;
      await this.votingSessionRepository.save(votingSession);

      // If someone was eliminated, reduce their score to ensure they're no longer tied
      if (results.eliminatedParticipant) {
        await this.participantRepository.update(
          { id: results.eliminatedParticipant.id },
          { score: Math.max(0, results.eliminatedParticipant.score - 1) }
        );
      }

      // Broadcast voting results
      await this.gameGateway.broadcastVotingSessionEnded(sessionId, results);
    } catch (error) {
      console.error('Error ending voting session:', error);
      // Still mark session as completed to prevent hanging
      votingSession.status = 'completed';
      await this.votingSessionRepository.save(votingSession);
    }
  }

  async getAllVotingSessions(): Promise<VotingSession[]> {
    return this.votingSessionRepository.find({
      relations: ['votes'],
      order: { createdAt: 'DESC' },
    });
  }

  async cancelVotingSession(sessionId: string): Promise<void> {
    // Clear any existing timeout
    const timeout = this.votingTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.votingTimeouts.delete(sessionId);
    }

    await this.votingSessionRepository.update(
      { id: sessionId },
      { status: 'cancelled' }
    );
    
    await this.gameGateway.broadcastVotingSessionCancelled(sessionId);
  }
} 