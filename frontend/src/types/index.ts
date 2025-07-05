export interface Participant {
  id: string;
  name: string;
  score: number;
  questionsAnswered: number;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  questionText: string;
  options: Record<string, string>;
  correctAnswer: string;
  points: number;
  isActive: boolean;
  createdAt: string;
}

export interface ParticipantAnswer {
  id: string;
  participantId: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  answeredAt: string;
  question?: Question;
}

export interface SubmitAnswerRequest {
  participantId: string;
  questionId: string;
  selectedAnswer: string;
}

export interface SubmitAnswerResponse {
  success: boolean;
  isCorrect: boolean;
  points: number;
  message: string;
}

export interface CreateParticipantRequest {
  name: string;
}

export interface GameState {
  currentQuestion: Question | null;
  participant: Participant | null;
  isLoading: boolean;
  error: string | null;
} 