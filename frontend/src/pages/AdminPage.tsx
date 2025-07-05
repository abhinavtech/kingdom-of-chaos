import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { participantsApi, questionsApi } from '../services/api';
import { socketService } from '../services/socket';
import { Participant, Question } from '../types';

const AdminPage: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadInitialData();
    
    // Connect to socket for real-time updates
    socketService.connect();
    socketService.joinAdmin();
    socketService.onLeaderboardUpdate(handleLeaderboardUpdate);
    
    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const [participantsData, questionsData] = await Promise.all([
        participantsApi.getLeaderboard(),
        questionsApi.getAll(),
      ]);
      
      setParticipants(participantsData);
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaderboardUpdate = (leaderboard: Participant[]) => {
    setParticipants(leaderboard);
    setLastUpdate(new Date());
  };

  const refreshData = async () => {
    try {
      const leaderboard = await participantsApi.getLeaderboard();
      setParticipants(leaderboard);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return 'text-yellow-400 bg-yellow-400/20 border-yellow-400';
      case 1: return 'text-gray-300 bg-gray-300/20 border-gray-300';
      case 2: return 'text-amber-600 bg-amber-600/20 border-amber-600';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-600';
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <motion.div
          data-testid="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-game font-bold text-transparent bg-clip-text bg-gradient-to-r from-chaos-400 to-primary-400 mb-4">
            ADMIN DASHBOARD
          </h1>
          <p className="text-gray-300 text-lg">
            Command the Kingdom • Monitor the Chaos
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card text-center"
            data-testid="participants-stat"
          >
            <div className="text-3xl font-bold text-primary-400 mb-2">
              {participants.length}
            </div>
            <div className="text-gray-300">Total Participants</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card text-center"
            data-testid="questions-stat"
          >
            <div className="text-3xl font-bold text-chaos-400 mb-2">
              {questions.length}
            </div>
            <div className="text-gray-300">Available Questions</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card text-center"
            data-testid="active-players-stat"
          >
            <div className="text-3xl font-bold text-green-400 mb-2">
              {participants.filter(p => p.score > 0).length}
            </div>
            <div className="text-gray-300">Active Players</div>
          </motion.div>
        </div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card mb-8"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-gray-300">
              <span className="text-sm">Last updated: </span>
              <span className="text-primary-400">
                {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={refreshData}
                className="btn-primary"
              >
                🔄 Refresh
              </button>
              
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">Live Updates</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-game font-bold text-white">
              🏆 LIVE LEADERBOARD
            </h2>
            <div className="text-sm text-gray-400">
              Real-time rankings
            </div>
          </div>

          {participants.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👑</div>
              <h3 className="text-xl text-gray-300 mb-2">No participants yet</h3>
              <p className="text-gray-500">Warriors are gathering...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {participants.map((participant, index) => (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-300 ${getRankColor(index)}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold min-w-[3rem] text-center">
                        {getRankIcon(index)}
                      </div>
                      
                      <div>
                        <div className="font-bold text-lg text-white">
                          {participant.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          Questions answered: {participant.questionsAnswered || 0}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {participant.score}
                      </div>
                      <div className="text-sm text-gray-400">
                        points
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Questions Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card mt-8"
        >
          <h2 className="text-2xl font-game font-bold text-white mb-6">
            📋 QUESTIONS OVERVIEW
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-bold text-primary-400">
                    Q{index + 1}
                  </span>
                  <span className="text-xs text-gray-400">
                    {question.points} pts
                  </span>
                </div>
                
                <p className="text-sm text-gray-300 line-clamp-2">
                  {question.questionText}
                </p>
                
                <div className="mt-2 text-xs text-gray-500">
                  {Object.keys(question.options).length} options
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPage; 