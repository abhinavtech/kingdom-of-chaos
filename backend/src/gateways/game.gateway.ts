import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, forwardRef } from '@nestjs/common';
import { ParticipantService } from '../services/participant.service';

@WebSocketGateway({
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://192.168.178.81:3000', // Allow network IP access
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/, // Allow any local network IP
    ],
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => ParticipantService))
    private participantService: ParticipantService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinAdmin')
  handleJoinAdmin(client: Socket) {
    client.join('admin');
    console.log(`Admin joined: ${client.id}`);
  }

  @SubscribeMessage('joinParticipant')
  handleJoinParticipant(client: Socket, participantId: string) {
    client.join(`participant_${participantId}`);
    console.log(`Participant ${participantId} joined: ${client.id}`);
  }

  async broadcastLeaderboardUpdate() {
    const leaderboard = await this.participantService.getLeaderboard();
    this.server.to('admin').emit('leaderboardUpdate', leaderboard);
  }

  async notifyAnswerSubmitted(participantId: string, result: any) {
    // Notify the participant
    this.server.to(`participant_${participantId}`).emit('answerResult', result);
    
    // Update leaderboard for admin
    await this.broadcastLeaderboardUpdate();
  }

  async broadcastQuestionReleased(question: any) {
    this.server.emit('questionReleased', question);
  }

  async broadcastQuestionsReset() {
    this.server.emit('questionsReset', { message: 'All questions have been reset' });
  }

  // Voting-related WebSocket methods
  async broadcastVotingSessionStarted(votingSession: any, tiedParticipants: any[]) {
    // Notify all tied participants about the voting session
    tiedParticipants.forEach(participant => {
      this.server.to(`participant_${participant.id}`).emit('votingSessionStarted', {
        votingSession,
        tiedParticipants,
      });
    });
    
    // Notify admin about the voting session
    this.server.to('admin').emit('votingSessionStarted', {
      votingSession,
      tiedParticipants,
    });
  }

  async broadcastVoteUpdate(votingSessionId: string) {
    // Notify all participants about vote updates
    this.server.emit('voteUpdate', { votingSessionId });
  }

  async broadcastVotingSessionEnded(sessionId: string, results: any) {
    // Notify all participants about voting results
    this.server.emit('votingSessionEnded', { sessionId, results });
  }

  async broadcastVotingSessionCancelled(sessionId: string) {
    // Notify all participants that voting was cancelled
    this.server.emit('votingSessionCancelled', { sessionId });
  }

  // Poll-related WebSocket methods
  async broadcastPollActivated(poll: any) {
    // Notify all participants about the new poll
    this.server.emit('pollActivated', poll);
  }

  async broadcastPollRankingUpdate(pollId: string) {
    // Notify all participants about ranking updates
    this.server.emit('pollRankingUpdate', { pollId });
  }

  async broadcastPollEnded(pollId: string, results: any) {
    // Notify all participants about poll results
    this.server.emit('pollEnded', { pollId, results });
  }
} 