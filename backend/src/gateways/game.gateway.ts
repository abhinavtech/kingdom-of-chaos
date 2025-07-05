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
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
} 