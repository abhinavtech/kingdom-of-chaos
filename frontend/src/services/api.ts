import axios from 'axios';
import {
  Participant,
  Question,
  ParticipantAnswer,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  CreateParticipantRequest,
} from '../types';

// Dynamically determine API URL based on current hostname
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // If accessing via localhost, use localhost for API
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }
  
  // If accessing via IP address, use the same IP for API
  return `http://${window.location.hostname}:3001/api`;
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Participants API
export const participantsApi = {
  create: async (data: CreateParticipantRequest): Promise<Participant> => {
    const response = await api.post('/participants', data);
    return response.data;
  },

  login: async (data: CreateParticipantRequest): Promise<Participant> => {
    const response = await api.post('/participants/login', data);
    return response.data;
  },

  getAll: async (): Promise<Participant[]> => {
    const response = await api.get('/participants');
    return response.data;
  },

  getById: async (id: string): Promise<Participant> => {
    const response = await api.get(`/participants/${id}`);
    return response.data;
  },

  getLeaderboard: async (): Promise<Participant[]> => {
    const response = await api.get('/participants/leaderboard');
    return response.data;
  },
};

// Questions API
export const questionsApi = {
  getAll: async (): Promise<Question[]> => {
    const response = await api.get('/questions');
    return response.data;
  },

  getById: async (id: string): Promise<Question> => {
    const response = await api.get(`/questions/${id}`);
    return response.data;
  },

  releaseNext: async (): Promise<any> => {
    const response = await api.post('/questions/release-next');
    return response.data;
  },

  resetAll: async (): Promise<any> => {
    const response = await api.post('/questions/reset-all');
    return response.data;
  },
};

// Game API
export const gameApi = {
  submitAnswer: async (data: SubmitAnswerRequest): Promise<SubmitAnswerResponse> => {
    const response = await api.post('/game/submit-answer', data);
    return response.data;
  },

  getParticipantAnswers: async (participantId: string): Promise<ParticipantAnswer[]> => {
    const response = await api.get(`/game/participant/${participantId}/answers`);
    return response.data;
  },
};

// Voting API
export const votingApi = {
  detectTie: async () => {
    const response = await api.post('/voting/detect-tie');
    return response.data;
  },

  submitVote: async (data: {
    votingSessionId: string;
    voterParticipantId: string;
    targetParticipantId: string;
    password: string;
  }) => {
    const response = await api.post('/voting/submit', data);
    return response.data;
  },

  getActiveVotingSession: async () => {
    const response = await api.get('/voting/active');
    return response.data;
  },

  getVotingSession: async (sessionId: string) => {
    const response = await api.get(`/voting/session/${sessionId}`);
    return response.data;
  },

  getVotingResults: async (sessionId: string) => {
    const response = await api.get(`/voting/results/${sessionId}`);
    return response.data;
  },

  endVotingSession: async (sessionId: string) => {
    const response = await api.post(`/voting/end/${sessionId}`);
    return response.data;
  },

  cancelVotingSession: async (sessionId: string) => {
    const response = await api.post(`/voting/cancel/${sessionId}`);
    return response.data;
  },

  getAllVotingSessions: async () => {
    const response = await api.get('/voting/all');
    return response.data;
  },

  getParticipant: async (participantId: string): Promise<Participant> => {
    const response = await api.get(`/participants/${participantId}`);
    return response.data;
  },
};

// Poll API
export const pollApi = {
  createPoll: async (data: {
    title: string;
    description?: string;
    timeLimit?: number;
  }) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('No admin token found');
    }

    const response = await api.post('/poll/create', data, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data;
  },

  activatePoll: async (pollId: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('No admin token found');
    }

    const response = await api.post(`/poll/activate/${pollId}`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data;
  },

  getActivePoll: async () => {
    const response = await api.get('/poll/active');
    return response.data;
  },

  getAllPolls: async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('No admin token found');
    }

    const response = await api.get('/poll/all', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data;
  },

  submitRankings: async (data: {
    pollId: string;
    rankerParticipantId: string;
    password: string;
    rankings: { participantId: string; rank: number }[];
  }) => {
    const response = await api.post('/poll/submit-rankings', data);
    return response.data;
  },

  getPollResults: async (pollId: string) => {
    const response = await api.get(`/poll/results/${pollId}`);
    return response.data;
  },

  endPoll: async (pollId: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('No admin token found');
    }

    const response = await api.post(`/poll/end/${pollId}`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data;
  },

  deletePoll: async (pollId: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('No admin token found');
    }

    const response = await api.post(`/poll/delete/${pollId}`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

// Admin API
export const adminApi = {
  login: async (password: string): Promise<{ success: boolean; token?: string; message?: string }> => {
    const response = await api.post('/admin/login', { password });
    return response.data;
  },

  validateToken: async (token: string): Promise<{ valid: boolean; message?: string }> => {
    const response = await api.get('/admin/validate', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data;
  },

  deleteAllUsers: async (): Promise<{ message: string; deletedParticipants: number; deletedAnswers: number }> => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('No admin token found');
    }

    const response = await api.delete('/admin/users/all', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

export default api; 