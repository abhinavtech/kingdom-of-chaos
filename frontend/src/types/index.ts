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
  password: string;
}

export interface SubmitAnswerResponse {
  success: boolean;
  isCorrect: boolean;
  points: number;
  message: string;
}

export interface CreateParticipantRequest {
  name: string;
  password: string;
}

export interface GameState {
  currentQuestion: Question | null;
  participant: Participant | null;
  isLoading: boolean;
  error: string | null;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  isActive: boolean;
  timeLimit: number;
  pollEndsAt?: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  rankings?: PollRanking[];
  createdAt: string;
  updatedAt: string;
}

export interface PollRanking {
  id: string;
  pollId: string;
  rankerParticipantId: string;
  rankedParticipantId: string;
  rank: number;
  createdAt: string;
  ranker?: Participant;
  ranked?: Participant;
}

export interface PollResult {
  participantId: string;
  participantName: string;
  averageRank: number;
  totalPoints: number;
}

export interface PollResultsResponse {
  poll: Poll;
  results: PollResult[];
  eliminatedParticipants: { participantId: string; participantName: string }[];
} 