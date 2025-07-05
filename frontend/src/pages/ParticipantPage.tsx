import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  const [lastResult, setLastResult] = useState<SubmitAnswerResponse | null>(null);
  const [name, setName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    loadQuestions();
    
    // Connect to socket
    socketService.connect();
    
    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleAnswerResult = React.useCallback((result: SubmitAnswerResponse) => {
    setLastResult(result);
    setShowResult(true);
    setIsSubmitting(false);
    
    // Update participant score if we have the updated data
    if (participant && result.success && result.isCorrect) {
      setParticipant(prev => prev ? { ...prev, score: prev.score + result.points } : null);
    }

    // Auto-advance to next question after 3 seconds
    setTimeout(() => {
      setShowResult(false);
      setSelectedAnswer('');
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }, 3000);
  }, [participant, currentQuestionIndex, questions.length]);

  useEffect(() => {
    if (participant) {
      socketService.joinParticipant(participant.id);
      socketService.onAnswerResult(handleAnswerResult);
    }
  }, [participant, handleAnswerResult]);

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
    if (!name.trim()) return;

    setIsJoining(true);
    try {
      const newParticipant = await participantsApi.create({ name: name.trim() });
      setParticipant(newParticipant);
    } catch (error) {
      console.error('Error joining game:', error);
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
    setLastResult(null);
    setName('');
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
          <h1 className="text-3xl font-game font-bold text-center mb-8 text-primary-400">
            Join the Battle
          </h1>
          
          <form onSubmit={handleJoinGame} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Enter your name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field w-full"
                placeholder="Your warrior name..."
                required
                maxLength={50}
              />
            </div>
            
            <button
              type="submit"
              disabled={isJoining || !name.trim()}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? 'Joining...' : 'Enter the Kingdom'}
            </button>
          </form>
        </motion.div>
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

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="card max-w-md w-full text-center"
        >
          <h1 className="text-3xl font-game font-bold mb-8 text-primary-400">
            Game Complete!
          </h1>
          
          <p className="text-xl text-gray-300 mb-4">
            Final Score: {participant.score}
          </p>
          
          <button
            onClick={resetGame}
            className="btn-primary"
          >
            Play Again
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
    </div>
  );
};

export default ParticipantPage; 