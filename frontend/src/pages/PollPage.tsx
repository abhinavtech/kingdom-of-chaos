import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pollApi, participantsApi } from '../services/api';
import { socketService } from '../services/socket';
import { Poll, Participant } from '../types';

interface PollPageProps {
  participant: Participant;
  onLogout: () => void;
}

const PollPage: React.FC<PollPageProps> = ({ participant, onLogout }) => {
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [rankings, setRankings] = useState<{ [participantId: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    loadPollData();
    loadParticipants();
    
    // Connect to socket for real-time updates
    socketService.connect();
    socketService.joinParticipant(participant.id);
    
    socketService.onPollActivated((poll) => {
      setActivePoll(poll);
      setNotification(`📊 New poll activated: ${poll.title}`);
      setTimeout(() => setNotification(null), 4000);
    });
    
    socketService.onPollEnded((data) => {
      setActivePoll(null);
      setNotification(`📊 Poll ended: ${data.results.poll.title}`);
      setTimeout(() => setNotification(null), 4000);
    });
    
    return () => {
      socketService.removePollListeners();
    };
  }, [participant.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activePoll && activePoll.pollEndsAt) {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const endTime = new Date(activePoll.pollEndsAt!).getTime();
        const difference = endTime - now;
        
        if (difference > 0) {
          setTimeLeft(Math.floor(difference / 1000));
        } else {
          setTimeLeft(0);
          setActivePoll(null);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activePoll]);

  const loadPollData = async () => {
    try {
      const result = await pollApi.getActivePoll();
      setActivePoll(result.poll);
    } catch (error) {
      console.error('Error loading poll data:', error);
    }
  };

  const loadParticipants = async () => {
    try {
      const result = await participantsApi.getLeaderboard();
      setParticipants(result.filter(p => p.id !== participant.id)); // Exclude self
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const handleRankChange = (participantId: string, rank: number) => {
    // Check if rank is already used
    const existingParticipant = Object.keys(rankings).find(
      id => rankings[id] === rank && id !== participantId
    );
    
    if (existingParticipant) {
      // Swap ranks
      setRankings(prev => ({
        ...prev,
        [participantId]: rank,
        [existingParticipant]: prev[participantId] || 0,
      }));
    } else {
      setRankings(prev => ({
        ...prev,
        [participantId]: rank,
      }));
    }
  };

  const handleSubmitRankings = async () => {
    if (!activePoll) return;
    
    // Check if all participants are ranked
    const rankedParticipants = Object.keys(rankings).filter(id => rankings[id] > 0);
    
    if (rankedParticipants.length !== participants.length) {
      setNotification('Please rank all participants before submitting');
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    // Check if all ranks are unique and valid
    const ranks = Object.values(rankings);
    const uniqueRanks = new Set(ranks);
    
    if (uniqueRanks.size !== ranks.length) {
      setNotification('All ranks must be unique');
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    const validRanks = ranks.every(rank => rank >= 1 && rank <= participants.length);
    if (!validRanks) {
      setNotification('Invalid rank values');
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    setShowPasswordModal(true);
  };

  const confirmSubmitRankings = async () => {
    if (!activePoll || !password) return;
    
    setIsSubmitting(true);
    
    try {
      const rankingsArray = Object.entries(rankings).map(([participantId, rank]) => ({
        participantId,
        rank,
      }));
      
      const result = await pollApi.submitRankings({
        pollId: activePoll.id,
        rankerParticipantId: participant.id,
        password,
        rankings: rankingsArray,
      });
      
      if (result.success) {
        setNotification('Rankings submitted successfully!');
        setTimeout(() => setNotification(null), 3000);
        setShowPasswordModal(false);
        setPassword('');
      } else {
        setNotification(result.message || 'Failed to submit rankings');
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      setNotification('Error submitting rankings');
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!activePoll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card max-w-2xl w-full text-center"
        >
          <div className="text-6xl mb-4">📊</div>
          <h1 className="text-3xl font-game font-bold text-white mb-4">
            No Active Poll
          </h1>
          <p className="text-gray-300 mb-6">
            There is currently no active poll. Please wait for the admin to activate a poll.
          </p>
          <button
            onClick={onLogout}
            className="btn-secondary"
          >
            🏠 Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={onLogout}
              className="btn-secondary text-sm px-4 py-2"
            >
              🏠 Back to Home
            </button>
            <h1 className="text-3xl md:text-5xl font-game font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              📊 POLL MODE
            </h1>
            <div className="text-sm text-gray-300">
              {participant.name}
            </div>
          </div>
        </motion.div>

        {/* Poll Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-8"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-game font-bold text-white mb-2">
                {activePoll.title}
              </h2>
              {activePoll.description && (
                <p className="text-gray-300">{activePoll.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-400">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-gray-400">Time Left</div>
            </div>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-blue-400 mb-2">📋 Instructions</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Rank all other participants from 1 (best) to {participants.length} (worst)</li>
              <li>• You cannot rank yourself</li>
              <li>• Each rank can only be used once</li>
              <li>• Your rankings will determine who gets eliminated</li>
              <li>• The bottom 3 participants will be eliminated</li>
            </ul>
          </div>
        </motion.div>

        {/* Rankings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card mb-8"
        >
          <h3 className="text-xl font-game font-bold text-white mb-6">
            🏆 Rank Your Fellow Participants
          </h3>
          
          <div className="space-y-4">
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{p.name}</div>
                    <div className="text-sm text-gray-400">
                      Current Score: {p.score} points
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-300">Rank:</label>
                  <select
                    value={rankings[p.id] || 0}
                    onChange={(e) => handleRankChange(p.id, Number(e.target.value))}
                    className="input-field w-20"
                  >
                    <option value={0}>-</option>
                    {Array.from({ length: participants.length }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={handleSubmitRankings}
              disabled={Object.keys(rankings).filter(id => rankings[id] > 0).length !== participants.length}
              className="btn-chaos disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🚀 Submit Rankings
            </button>
          </div>
        </motion.div>

        {/* Notifications */}
        {notification && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
            {notification}
          </div>
        )}

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-bold text-white mb-4">Confirm Rankings</h3>
              <p className="text-gray-300 mb-4">
                Enter your password to confirm your rankings:
              </p>
              
              <div className="space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full"
                  placeholder="Enter your password..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      confirmSubmitRankings();
                    }
                  }}
                />
                
                <div className="flex gap-4">
                  <button
                    onClick={confirmSubmitRankings}
                    disabled={isSubmitting || !password}
                    className="btn-chaos flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : '✅ Confirm'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPassword('');
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PollPage;