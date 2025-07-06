import { io, Socket } from 'socket.io-client';
import { Participant, SubmitAnswerResponse } from '../types';

// Dynamically determine Socket URL based on current hostname
const getSocketUrl = () => {
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL;
  }
  
  // If accessing via localhost, use localhost for socket
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // If accessing via IP address, use the same IP for socket
  return `http://${window.location.hostname}:3001`;
};

const SOCKET_URL = getSocketUrl();

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

  onQuestionsReset(callback: () => void): void {
    if (this.socket) {
      this.socket.on('questionsReset', callback);
    }
  }

  // Voting methods
  onVotingSessionStarted(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('votingSessionStarted', callback);
    }
  }

  onVotingSessionEnded(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('votingSessionEnded', callback);
    }
  }

  onVotingSessionCancelled(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('votingSessionCancelled', callback);
    }
  }

  onVoteUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('voteUpdate', callback);
    }
  }

  removeVotingListeners(): void {
    if (this.socket) {
      this.socket.off('votingSessionStarted');
      this.socket.off('votingSessionEnded');
      this.socket.off('votingSessionCancelled');
      this.socket.off('voteUpdate');
    }
  }
}

export const socketService = new SocketService();
export default socketService; 