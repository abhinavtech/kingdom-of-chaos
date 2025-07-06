import { Controller, Post, Get, Body, Param, ValidationPipe } from '@nestjs/common';
import { VotingService } from '../services/voting.service';

export class SubmitVoteDto {
  votingSessionId: string;
  voterParticipantId: string;
  targetParticipantId: string;
  password: string;
}

@Controller('voting')
export class VotingController {
  constructor(private readonly votingService: VotingService) {}

  @Post('detect-tie')
  async detectTie() {
    const votingSession = await this.votingService.detectTieAndCreateVotingSession();
    return {
      success: !!votingSession,
      votingSession,
      message: votingSession ? 'Tie detected, voting session created' : 'No tie detected',
    };
  }

  @Post('submit')
  async submitVote(@Body(ValidationPipe) submitVoteDto: SubmitVoteDto) {
    return this.votingService.submitVote(
      submitVoteDto.votingSessionId,
      submitVoteDto.voterParticipantId,
      submitVoteDto.targetParticipantId,
      submitVoteDto.password
    );
  }

  @Get('active')
  async getActiveVotingSession() {
    const votingSession = await this.votingService.getActiveVotingSession();
    return {
      success: !!votingSession,
      votingSession,
    };
  }

  @Get('session/:id')
  async getVotingSession(@Param('id') sessionId: string) {
    const votingSession = await this.votingService.getVotingSession(sessionId);
    return {
      success: !!votingSession,
      votingSession,
    };
  }

  @Get('results/:id')
  async getVotingResults(@Param('id') sessionId: string) {
    try {
      const results = await this.votingService.getVotingResults(sessionId);
      return {
        success: true,
        ...results,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Post('end/:id')
  async endVotingSession(@Param('id') sessionId: string) {
    await this.votingService.endVotingSession(sessionId);
    return {
      success: true,
      message: 'Voting session ended',
    };
  }

  @Post('cancel/:id')
  async cancelVotingSession(@Param('id') sessionId: string) {
    await this.votingService.cancelVotingSession(sessionId);
    return {
      success: true,
      message: 'Voting session cancelled',
    };
  }

  @Get('all')
  async getAllVotingSessions() {
    const sessions = await this.votingService.getAllVotingSessions();
    return {
      success: true,
      sessions,
    };
  }
} 