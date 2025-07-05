import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <motion.h1
          className="text-6xl md:text-8xl font-game font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-chaos-400 mb-4"
          animate={{ 
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          KINGDOM
        </motion.h1>
        
        <motion.h2
          className="text-4xl md:text-6xl font-game font-bold text-transparent bg-clip-text bg-gradient-to-r from-chaos-400 to-primary-400 mb-8"
          animate={{ 
            backgroundPosition: ['100% 50%', '0% 50%', '100% 50%'],
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          OF CHAOS
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto"
        >
          Enter the realm where knowledge reigns supreme and chaos tests your wisdom.
          Choose your path and prove your worth!
        </motion.p>

        <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/participant"
              className="block bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-6 px-12 rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl"
            >
              <div className="text-center">
                <div className="text-2xl font-game mb-2">🎮 PARTICIPANT</div>
                <div className="text-sm opacity-90">Join the battle of minds</div>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/admin"
              className="block bg-gradient-to-r from-chaos-600 to-chaos-700 hover:from-chaos-700 hover:to-chaos-800 text-white font-bold py-6 px-12 rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl"
            >
              <div className="text-center">
                <div className="text-2xl font-game mb-2">👑 ADMIN</div>
                <div className="text-sm opacity-90">Command the chaos</div>
              </div>
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="mt-16 text-gray-500 text-sm"
        >
          <p>Real-time multiplayer quiz game • Live scoreboard • Instant results</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HomePage; 