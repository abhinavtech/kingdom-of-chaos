import { io, Socket } from 'socket.io-client';
import { Participant, SubmitAnswerResponse } from '../types';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_URL);
    }
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Admin methods
  joinAdmin(): void {
    if (this.socket) {
      this.socket.emit('joinAdmin');
    }
  }

  onLeaderboardUpdate(callback: (leaderboard: Participant[]) => void): void {
    if (this.socket) {
      this.socket.on('leaderboardUpdate', callback);
    }
  }

  // Participant methods
  joinParticipant(participantId: string): void {
    if (this.socket) {
      this.socket.emit('joinParticipant', participantId);
    }
  }

  onAnswerResult(callback: (result: SubmitAnswerResponse) => void): void {
    if (this.socket) {
      this.socket.on('answerResult', callback);
    }
  }

  // Cleanup
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  onQuestionReleased(callback: (question: any) => void): void {
    if (this.socket) {
      this.socket.on('questionReleased', callback);
    }
  }
}

export const socketService = new SocketService();
export default socketService; 