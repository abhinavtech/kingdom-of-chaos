-- Kingdom of Chaos Database Initialization

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer VARCHAR(255) NOT NULL,
    points INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT false
);

-- Create participant_answers table
CREATE TABLE IF NOT EXISTS participant_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    selected_answer VARCHAR(255) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(participant_id, question_id)
);

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT false,
    time_limit INTEGER DEFAULT 300,
    poll_ends_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create poll_rankings table
CREATE TABLE IF NOT EXISTS poll_rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    ranker_participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    ranked_participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poll_id, ranker_participant_id, ranked_participant_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_participants_score ON participants(score DESC);
CREATE INDEX IF NOT EXISTS idx_participant_answers_participant_id ON participant_answers(participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_answers_question_id ON participant_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_poll_rankings_poll_id ON poll_rankings(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_rankings_ranker_participant ON poll_rankings(ranker_participant_id);
CREATE INDEX IF NOT EXISTS idx_poll_rankings_ranked_participant ON poll_rankings(ranked_participant_id);

-- Insert sample questions
INSERT INTO questions (question_text, options, correct_answer, points, is_active) VALUES
('What is the capital of France?', 
 '{"A": "London", "B": "Berlin", "C": "Paris", "D": "Madrid"}', 
 'C', 10, false),
('Which planet is known as the Red Planet?', 
 '{"A": "Venus", "B": "Mars", "C": "Jupiter", "D": "Saturn"}', 
 'B', 10, false),
('What is 2 + 2?', 
 '{"A": "3", "B": "4", "C": "5", "D": "6"}', 
 'B', 5, false),
('Who painted the Mona Lisa?', 
 '{"A": "Van Gogh", "B": "Picasso", "C": "Da Vinci", "D": "Monet"}', 
 'C', 15, false),
('What is the largest ocean on Earth?', 
 '{"A": "Atlantic", "B": "Indian", "C": "Arctic", "D": "Pacific"}', 
 'D', 10, false); 