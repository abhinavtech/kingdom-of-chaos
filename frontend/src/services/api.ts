import axios from 'axios';
import {
  Participant,
  Question,
  ParticipantAnswer,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  CreateParticipantRequest,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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
};

export default api; 