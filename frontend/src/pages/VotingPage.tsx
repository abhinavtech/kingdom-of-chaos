import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { votingApi } from '../services/api';
import { socketService } from '../services/socket';
import { Participant } from '../types';

interface VotingSession {
  id: string;
  tiedParticipants: string[];
  tiedScore: number;
  status: 'active' | 'completed' | 'cancelled';
  votingTimeInSeconds: number;
  votingEndsAt: string;
}

interface VotingPageProps {
  participant: Participant;
  password: string;
  onVotingComplete: () => void;
}

const VotingPage: React.FC<VotingPageProps> = ({ participant, password, onVotingComplete }) => {
  const [votingSession, setVotingSession] = useState<VotingSession | null>(null);
  const [tiedParticipants, setTiedParticipants] = useState<Participant[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [voteResults, setVoteResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    // Listen for voting session events
    socketService.onVotingSessionStarted(handleVotingSessionStarted);
    socketService.onVotingSessionEnded(handleVotingSessionEnded);
    socketService.onVotingSessionCancelled(handleVotingSessionCancelled);
    socketService.onVoteUpdate(handleVoteUpdate);

    // Load active voting session if any
    loadActiveVotingSession();

    return () => {
      socketService.removeVotingListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer effect
  useEffect(() => {
    if (votingSession && votingSession.status === 'active') {
      const endTime = new Date(votingSession.votingEndsAt).getTime();
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeLeft(timeLeft);
        
        if (timeLeft === 0) {
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [votingSession]);

  const loadActiveVotingSession = async () => {
    try {
      const response = await votingApi.getActiveVotingSession();
      if (response.success && response.votingSession) {
        setVotingSession(response.votingSession);
        await loadTiedParticipants(response.votingSession.tiedParticipants);
      }
    } catch (error) {
      console.error('Error loading active voting session:', error);
    }
  };

  const loadTiedParticipants = async (participantIds: string[]) => {
    try {
      const participants = await Promise.all(
        participantIds.map(async (id) => {
          try {
            const response = await votingApi.getParticipant(id);
            return response;
          } catch (error) {
            console.error(`Error loading participant ${id}:`, error);
            return null;
          }
        })
      );
      setTiedParticipants(participants.filter(p => p !== null) as Participant[]);
    } catch (error) {
      console.error('Error loading tied participants:', error);
    }
  };

  const handleVotingSessionStarted = async (data: { votingSession: VotingSession; tiedParticipants: Participant[] }) => {
    setVotingSession(data.votingSession);
    setTiedParticipants(data.tiedParticipants);
    setHasVoted(false);
    setSelectedTarget('');
    setShowResults(false);
    setNotification('🗳️ Voting session started! Choose someone to eliminate.');
    setTimeout(() => setNotification(null), 5000);
  };

  const handleVotingSessionEnded = (data: { sessionId: string; results: any }) => {
    if (votingSession && votingSession.id === data.sessionId) {
      setVoteResults(data.results);
      setShowResults(true);
      setVotingSession(prev => prev ? { ...prev, status: 'completed' } : null);
      
      // Show results for 5 seconds, then call onVotingComplete
      setTimeout(() => {
        onVotingComplete();
      }, 5000);
    }
  };

  const handleVotingSessionCancelled = (data: { sessionId: string }) => {
    if (votingSession && votingSession.id === data.sessionId) {
      setNotification('⚠️ Voting session was cancelled');
      setTimeout(() => {
        onVotingComplete();
      }, 3000);
    }
  };

  const handleVoteUpdate = (data: { votingSessionId: string }) => {
    // Could refresh voting data here if needed
    console.log('Vote update received for session:', data.votingSessionId);
  };

  const handleSubmitVote = async () => {
    if (!votingSession || !selectedTarget || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await votingApi.submitVote({
        votingSessionId: votingSession.id,
        voterParticipantId: participant.id,
        targetParticipantId: selectedTarget,
        password,
      });

      if (result.success) {
        setHasVoted(true);
        setNotification('✅ Vote submitted successfully!');
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification(`❌ ${result.message}`);
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      setNotification('❌ Failed to submit vote. Please try again.');
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If not eligible to vote (not in tied participants)
  if (votingSession && !votingSession.tiedParticipants.includes(participant.id)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card max-w-md w-full text-center"
        >
          <div className="text-6xl mb-6">👁️</div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Voting in Progress
          </h1>
          <p className="text-gray-300 mb-6">
            A tie-breaker vote is happening among the top players. You are not eligible to vote.
          </p>
          <div className="text-lg text-red-400 font-mono">
            Time remaining: {formatTime(timeLeft)}
          </div>
        </motion.div>
      </div>
    );
  }

  // Show results
  if (showResults && voteResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card max-w-2xl w-full text-center"
        >
          <div className="text-6xl mb-6">🗳️</div>
          <h1 className="text-3xl font-bold text-white mb-6">
            Voting Results
          </h1>
          
          {voteResults.eliminatedParticipant && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <h2 className="text-xl font-bold text-red-400 mb-2">
                Eliminated Player
              </h2>
              <p className="text-2xl text-white">
                {voteResults.eliminatedParticipant.name}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {Object.entries(voteResults.voteCount).map(([participantId, votes]) => {
              const participant = tiedParticipants.find(p => p.id === participantId);
              return (
                <div key={participantId} className="bg-gray-700/50 p-4 rounded-lg">
                  <div className="text-white font-semibold">{participant?.name}</div>
                  <div className="text-gray-300">{String(votes)} votes</div>
                </div>
              );
            })}
          </div>

          <p className="text-gray-400">
            Total votes: {voteResults.totalVotes}
          </p>
        </motion.div>
      </div>
    );
  }

  // No voting session
  if (!votingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card max-w-md w-full text-center"
        >
          <div className="text-6xl mb-6">⏳</div>
          <h1 className="text-2xl font-bold text-white mb-4">
            No Active Voting
          </h1>
          <p className="text-gray-300">
            No tie-breaker voting session is currently active.
          </p>
        </motion.div>
      </div>
    );
  }

  // Main voting interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="text-6xl mb-4">🗳️</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            TIE-BREAKER VOTE
          </h1>
          <p className="text-gray-300 text-lg mb-4">
            Multiple players are tied with {votingSession.tiedScore} points
          </p>
          <div className="text-2xl text-red-400 font-mono">
            Time remaining: {formatTime(timeLeft)}
          </div>
        </motion.div>

        {/* Voting Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Choose someone to eliminate
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <AnimatePresence>
              {tiedParticipants.map((targetParticipant) => (
                <motion.div
                  key={targetParticipant.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedTarget === targetParticipant.id
                      ? 'border-red-500 bg-red-500/20'
                      : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedTarget(targetParticipant.id)}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">👤</div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {targetParticipant.name}
                    </h3>
                    <p className="text-gray-300">
                      {targetParticipant.score} points
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            {hasVoted ? (
              <div className="text-green-400 text-lg font-semibold">
                ✅ Vote submitted! Waiting for other players...
              </div>
            ) : (
              <button
                onClick={handleSubmitVote}
                disabled={!selectedTarget || isSubmitting || timeLeft === 0}
                className="btn-primary px-8 py-3 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Vote'}
              </button>
            )}
          </div>
        </motion.div>

        {/* Notification */}
        {notification && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
            {notification}
          </div>
        )}
      </div>
    </div>
  );
};

export default VotingPage; 