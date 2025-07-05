# Kingdom of Chaos 🏰

Welcome to the Kingdom of Chaos - a real-time multiplayer quiz game where knowledge reigns supreme and chaos tests your wisdom!

## 🎮 Features

- **Real-time Multiplayer**: Multiple participants can play simultaneously
- **Live Scoreboard**: Admin dashboard with real-time leaderboard updates
- **WebSocket Integration**: Instant updates and notifications
- **Modern UI**: Beautiful, responsive design with smooth animations
- **Two Game Modes**: 
  - 🎮 **Participant Mode**: Join and answer questions
  - 👑 **Admin Mode**: Monitor live scoreboard and game stats

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Docker & Docker Compose
- npm

### One-Command Setup
```bash
./start-game.sh
```

This script will:
1. Start PostgreSQL database (Docker)
2. Launch the backend API server
3. Start the frontend React application
4. Open the game in your browser

### Manual Setup

#### 1. Database Setup
```bash
cd backend
npm run db:up
```

#### 2. Backend Setup
```bash
cd backend
npm install
npm run start:dev
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 🏗️ Project Structure

```
kingdom-of-chaos/
├── backend/                 # NestJS TypeScript API
│   ├── src/
│   │   ├── controllers/     # REST API endpoints
│   │   ├── services/        # Business logic
│   │   ├── entities/        # Database models
│   │   ├── dto/            # Data transfer objects
│   │   ├── gateways/       # WebSocket handlers
│   │   └── config/         # Database configuration
│   ├── docker-compose.yml  # PostgreSQL setup
│   └── init-db.sql         # Database schema & sample data
├── frontend/               # React TypeScript SPA
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── services/       # API & WebSocket services
│   │   ├── types/          # TypeScript definitions
│   │   └── hooks/          # Custom React hooks
│   └── tailwind.config.js  # Tailwind CSS configuration
├── start-game.sh           # One-command startup script
└── README.md
```

## 🎯 How to Play

### For Participants
1. Visit `http://localhost:3000`
2. Click "🎮 PARTICIPANT"
3. Enter your name
4. Answer questions and compete!

### For Admins
1. Visit `http://localhost:3000`
2. Click "👑 ADMIN"
3. Monitor live scoreboard
4. View game statistics

## 🔧 Technology Stack

### Backend
- **NestJS** - Node.js framework
- **TypeScript** - Type-safe JavaScript
- **PostgreSQL** - Database
- **TypeORM** - Database ORM
- **Socket.IO** - WebSocket communication
- **Docker** - Database containerization

### Frontend
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Animation library
- **Socket.IO Client** - Real-time communication
- **React Router** - Navigation

## 🌐 API Endpoints

### Participants
- `POST /api/participants` - Create new participant
- `GET /api/participants` - Get all participants
- `GET /api/participants/leaderboard` - Get leaderboard
- `GET /api/participants/:id` - Get participant by ID

### Questions
- `GET /api/questions` - Get all active questions
- `GET /api/questions/:id` - Get question by ID

### Game
- `POST /api/game/submit-answer` - Submit an answer
- `GET /api/game/participant/:id/answers` - Get participant's answers

### WebSocket Events
- `joinAdmin` - Join admin room for live updates
- `joinParticipant` - Join participant room
- `leaderboardUpdate` - Receive leaderboard updates
- `answerResult` - Receive answer feedback

## 🎨 UI Features

- **Responsive Design**: Works on desktop and mobile
- **Dark Theme**: Modern dark UI with gradient accents
- **Smooth Animations**: Framer Motion powered transitions
- **Real-time Updates**: Live scoreboard without page refresh
- **Game Font**: Custom Orbitron font for gaming aesthetic

## 🔧 Development

### Backend Development
```bash
cd backend
npm run start:dev  # Development server with hot reload
npm run db:up      # Start database
npm run db:down    # Stop database
npm run db:logs    # View database logs
```

### Frontend Development
```bash
cd frontend
npm start          # Development server
npm run build      # Production build
```

## 🐳 Database

The application uses PostgreSQL with the following schema:
- **participants**: Player information and scores
- **questions**: Quiz questions with options and correct answers
- **participant_answers**: Tracking of submitted answers

Sample questions are automatically loaded on database initialization.

## 🎮 Game Flow

1. **Participant joins** → Creates account → Enters game
2. **Questions display** → Participant selects answer → Submits
3. **Real-time scoring** → Updates participant score → Broadcasts to admin
4. **Live leaderboard** → Admin sees updates instantly → Rankings update
5. **Game completion** → Final scores displayed → Option to play again

## 📱 Screenshots

- **Home Page**: Choose between Participant and Admin modes
- **Participant View**: Answer questions with real-time feedback
- **Admin Dashboard**: Live leaderboard with statistics and question overview

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🎉 Enjoy the Game!

May the best warrior win in the Kingdom of Chaos! 🏆 