import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';

// Entities
import { Participant } from './entities/participant.entity';
import { Question } from './entities/question.entity';
import { ParticipantAnswer } from './entities/participant-answer.entity';
import { VotingSession } from './entities/voting-session.entity';
import { Vote } from './entities/vote.entity';
import { Poll } from './entities/poll.entity';
import { PollRanking } from './entities/poll-ranking.entity';

// Services
import { ParticipantService } from './services/participant.service';
import { QuestionService } from './services/question.service';
import { GameService } from './services/game.service';
import { AdminService } from './services/admin.service';
import { VotingService } from './services/voting.service';
import { PollService } from './services/poll.service';

// Controllers
import { ParticipantController } from './controllers/participant.controller';
import { QuestionController } from './controllers/question.controller';
import { GameController } from './controllers/game.controller';
import { AdminController } from './controllers/admin.controller';
import { VotingController } from './controllers/voting.controller';
import { PollController } from './controllers/poll.controller';

// Gateways
import { GameGateway } from './gateways/game.gateway';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([Participant, Question, ParticipantAnswer, VotingSession, Vote, Poll, PollRanking]),
  ],
  controllers: [ParticipantController, QuestionController, GameController, AdminController, VotingController, PollController],
  providers: [ParticipantService, QuestionService, GameService, AdminService, VotingService, PollService, GameGateway],
})
export class AppModule {} 