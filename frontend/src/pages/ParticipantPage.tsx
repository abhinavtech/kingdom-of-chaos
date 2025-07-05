import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { participantsApi, questionsApi, gameApi } from '../services/api';
import { socketService } from '../services/socket';
import { Participant, Question, SubmitAnswerResponse } from '../types';

const ParticipantPage: React.FC = () => {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [lastResult, setLastResult] = useState<SubmitAnswerResponse | null>(null);
  const [name, setName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const [authError, setAuthError] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<Participant[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [hasNewQuestion, setHasNewQuestion] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const hasAnsweredCurrentQuestion = currentQuestion && answeredQuestions.has(currentQuestion.id);

  useEffect(() => {
    loadQuestions();
    requestNotificationPermission();
    
    // Connect to socket
    socketService.connect();
    
    socketService.onAnswerResult(handleAnswerResult);
    socketService.onQuestionReleased(handleQuestionReleased);
    socketService.onLeaderboardUpdate(handleLeaderboardUpdate);
    
    return () => {
      socketService.disconnect();
    };
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const showBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'new-question',
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        handleNewQuestionClick();
        notification.close();
      };

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    }
  };

  const handleQuestionReleased = (question: Question) => {
    setNotification(`🚀 New question released: ${question.questionText}`);
    setHasNewQuestion(true);
    
    // Show browser notification
    showBrowserNotification(
      '🏰 Kingdom of Chaos - New Question!',
      `${question.questionText.substring(0, 50)}...`
    );
    
    // Reload questions
    loadQuestions();
    
    setTimeout(() => setNotification(null), 6000);
  };

  const handleLeaderboardUpdate = (updatedLeaderboard: Participant[]) => {
    setLeaderboard(updatedLeaderboard);
  };

  const handleAnswerResult = React.useCallback((result: SubmitAnswerResponse) => {
    setLastResult(result);
    setShowResult(true);
    setIsSubmitting(false);
    
    // Mark this question as answered
    if (currentQuestion) {
      setAnsweredQuestions(prev => new Set([...Array.from(prev), currentQuestion.id]));
    }
    
    // Update participant score if we have the updated data
    if (participant && result.success && result.isCorrect) {
      setParticipant(prev => prev ? { ...prev, score: prev.score + result.points } : null);
    }

    // Show result for 3 seconds, then show leaderboard
    setTimeout(() => {
      setShowResult(false);
      setShowLeaderboard(true);
      loadLeaderboard();
    }, 3000);
  }, [participant, currentQuestion]);

  const handleNewQuestionClick = () => {
    setHasNewQuestion(false);
    setShowLeaderboard(false);
    
    // Find the next unanswered question
    const nextUnansweredIndex = questions.findIndex(q => !answeredQuestions.has(q.id));
    if (nextUnansweredIndex !== -1) {
      setCurrentQuestionIndex(nextUnansweredIndex);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const leaderboardData = await participantsApi.getLeaderboard();
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  useEffect(() => {
    if (participant) {
      socketService.joinParticipant(participant.id);
      loadParticipantAnswers();
    }
  }, [participant]);

  useEffect(() => {
    if (showLeaderboard) {
      loadLeaderboard();
    }
  }, [showLeaderboard]);

  const loadParticipantAnswers = async () => {
    if (!participant) return;
    try {
      const answers = await gameApi.getParticipantAnswers(participant.id);
      const answeredQuestionIds = new Set(answers.map(answer => answer.questionId));
      setAnsweredQuestions(answeredQuestionIds);
    } catch (error) {
      console.error('Error loading participant answers:', error);
    }
  };

  const loadQuestions = async () => {
    try {
      const questionsData = await questionsApi.getAll();
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) return;
    setIsJoining(true);
    setAuthError('');
    
    try {
      let participant;
      if (isLogin) {
        // Try to login
        participant = await participantsApi.login({ name: name.trim(), password: password.trim() });
      } else {
        // Try to create new participant
        participant = await participantsApi.create({ name: name.trim(), password: password.trim() });
      }
      setParticipant(participant);
    } catch (error: any) {
      console.error('Error joining game:', error);
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        setAuthError('This name is already taken. Please try logging in instead.');
        setIsLogin(true);
      } else if (error.response?.status === 401) {
        setAuthError('Invalid name or password. Please try again.');
      } else {
        setAuthError('Failed to join game. Please try again.');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!participant || !currentQuestion || !selectedAnswer || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await gameApi.submitAnswer({
        participantId: participant.id,
        questionId: currentQuestion.id,
        selectedAnswer,
        password: password.trim(),
      });
      // The result will be handled by the WebSocket callback
    } catch (error) {
      console.error('Error submitting answer:', error);
      setIsSubmitting(false);
    }
  };

  const resetGame = () => {
    setParticipant(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setShowResult(false);
    setShowLeaderboard(false);
    setLastResult(null);
    setName('');
    setPassword('');
    setAnsweredQuestions(new Set());
    setHasNewQuestion(false);
    setIsLogin(false);
    setAuthError('');
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

  if (!participant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="card max-w-md w-full"
        >
          <h1 className="text-3xl font-game font-bold text-center mb-4 text-primary-400">
            {isLogin ? 'Welcome Back, Warrior!' : 'Join the Battle'}
          </h1>
          
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm mb-4">
              {isLogin ? 'Enter your credentials to continue your quest' : 'Create your warrior profile to begin'}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setAuthError('');
              }}
              className="text-primary-400 hover:text-primary-300 text-sm underline"
            >
              {isLogin ? 'New warrior? Create account' : 'Returning warrior? Login here'}
            </button>
          </div>
          
          <form onSubmit={handleJoinGame} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                {isLogin ? 'Your warrior name' : 'Enter your name'}
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setAuthError('');
                }}
                className="input-field w-full"
                placeholder="Your warrior name..."
                required
                maxLength={50}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                {isLogin ? 'Your password' : 'Set a password'}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setAuthError('');
                }}
                className="input-field w-full"
                placeholder="Password (min 4 chars)"
                required
                minLength={4}
                maxLength={255}
              />
            </div>

            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm"
              >
                🚫 {authError}
              </motion.div>
            )}
            
            <button
              type="submit"
              disabled={isJoining || !name.trim() || !password.trim()}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? (isLogin ? 'Logging in...' : 'Joining...') : (isLogin ? 'Login' : 'Enter the Kingdom')}
            </button>
          </form>
        </motion.div>
        {notification && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-chaos-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
            {notification}
          </div>
        )}
      </div>
    );
  }

  if (showResult && lastResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`card max-w-md w-full text-center ${
            lastResult.isCorrect ? 'border-green-500' : 'border-red-500'
          }`}
        >
          <div className={`text-6xl mb-4 ${lastResult.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {lastResult.isCorrect ? '🎉' : '😞'}
          </div>
          
          <h2 className={`text-2xl font-bold mb-4 ${lastResult.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {lastResult.message}
          </h2>
          
          {lastResult.isCorrect && (
            <p className="text-lg text-green-300 mb-4">
              +{lastResult.points} points
            </p>
          )}
          
          <p className="text-gray-300">
            Current Score: {participant.score}
          </p>
        </motion.div>
      </div>
    );
  }

  if (showLeaderboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mb-8"
          >
            <div>
              <h1 className="text-2xl font-game font-bold text-primary-400">
                {participant.name}
              </h1>
              <p className="text-gray-300">Score: {participant.score}</p>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-400">
                Questions Answered: {answeredQuestions.size} of {questions.length}
              </p>
            </div>
          </motion.div>

          {/* New Question Notification */}
          {hasNewQuestion && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card mb-8 bg-gradient-to-r from-chaos-600/20 to-primary-600/20 border-chaos-500"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">🚀</div>
                <h2 className="text-xl font-bold text-white mb-4">
                  New Question Available!
                </h2>
                <p className="text-gray-300 mb-6">
                  A new question has been released. Ready to continue your quest?
                </p>
                <button
                  onClick={handleNewQuestionClick}
                  className="btn-primary px-8 py-3 text-lg"
                >
                  Answer New Question
                </button>
              </div>
            </motion.div>
          )}

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-game font-bold text-white">
                🏆 LEADERBOARD
              </h2>
              <div className="text-sm text-gray-400">
                Current standings
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👑</div>
                <h3 className="text-xl text-gray-300 mb-2">Loading rankings...</h3>
                <p className="text-gray-500">Please wait...</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-2">
                <div className="space-y-3">
                  <AnimatePresence>
                    {leaderboard.map((p, index) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-300 ${
                          p.id === participant.id 
                            ? 'border-primary-500 bg-primary-500/20' 
                            : getRankColor(index)
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold min-w-[3rem] text-center">
                            {getRankIcon(index)}
                          </div>
                          
                          <div>
                            <div className={`font-bold text-lg ${p.id === participant.id ? 'text-primary-300' : 'text-white'}`}>
                              {p.name} {p.id === participant.id && '(You)'}
                            </div>
                            <div className="text-sm text-gray-400">
                              Questions answered: {p.questionsAnswered || 0}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`text-2xl font-bold ${p.id === participant.id ? 'text-primary-300' : 'text-white'}`}>
                            {p.score}
                          </div>
                          <div className="text-sm text-gray-400">
                            points
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                {/* Participant count indicator */}
                <div className="text-center mt-4 py-2 text-sm text-gray-400 border-t border-gray-700">
                  Showing {leaderboard.length} participants
                </div>
              </div>
            )}

            {/* Waiting message */}
            {!hasNewQuestion && (
              <div className="text-center mt-8 p-6 bg-gray-700/30 rounded-lg">
                <div className="text-3xl mb-4">⏳</div>
                <h3 className="text-lg text-gray-300 mb-2">Waiting for next question...</h3>
                <p className="text-gray-500">
                  The admin will release the next question soon. You'll get a notification when it's ready!
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Notification */}
        {notification && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-chaos-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
            {notification}
          </div>
        )}
      </div>
    );
  }

  // If no current question or all questions answered
  if (!currentQuestion || hasAnsweredCurrentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="card max-w-md w-full text-center"
        >
          <h1 className="text-3xl font-game font-bold mb-8 text-primary-400">
            {answeredQuestions.size === questions.length ? 'All Questions Completed!' : 'Waiting for Questions...'}
          </h1>
          
          <p className="text-xl text-gray-300 mb-4">
            Current Score: {participant.score}
          </p>
          
          <p className="text-gray-400 mb-6">
            {answeredQuestions.size === questions.length 
              ? 'You have answered all available questions. Great job!' 
              : 'New questions will be released by the admin. You\'ll get a notification when they\'re ready!'}
          </p>
          
          <button
            onClick={() => {
              setShowLeaderboard(true);
              loadLeaderboard();
            }}
            className="btn-primary mb-4"
          >
            View Leaderboard
          </button>
          
          <button
            onClick={resetGame}
            className="btn-secondary"
          >
            Leave Game
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
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-2xl font-game font-bold text-primary-400">
              {participant.name}
            </h1>
            <p className="text-gray-300">Score: {participant.score}</p>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-400">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
        </motion.div>

        {/* Question Card */}
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="card mb-8"
        >
          <h2 className="text-xl font-bold text-white mb-6">
            {currentQuestion.questionText}
          </h2>
          
          <div className="space-y-3">
            {Object.entries(currentQuestion.options).map(([key, value]) => (
              <motion.button
                key={key}
                data-testid={`answer-option-${key}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedAnswer(key)}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedAnswer === key
                    ? 'border-primary-500 bg-primary-500/20 text-primary-300 selected'
                    : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                }`}
              >
                <span className="font-bold text-primary-400 mr-3">{key}.</span>
                {value}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <button
            onClick={handleAnswerSubmit}
            disabled={!selectedAnswer || isSubmitting}
            className="btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="submit-answer-btn"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </button>
        </motion.div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-chaos-600 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          {notification}
        </div>
      )}
    </div>
  );
};

export default ParticipantPage; 