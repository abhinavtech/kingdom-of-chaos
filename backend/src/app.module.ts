import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';

// Entities
import { Participant } from './entities/participant.entity';
import { Question } from './entities/question.entity';
import { ParticipantAnswer } from './entities/participant-answer.entity';
import { VotingSession } from './entities/voting-session.entity';
import { Vote } from './entities/vote.entity';

// Services
import { ParticipantService } from './services/participant.service';
import { QuestionService } from './services/question.service';
import { GameService } from './services/game.service';
import { AdminService } from './services/admin.service';
import { VotingService } from './services/voting.service';

// Controllers
import { ParticipantController } from './controllers/participant.controller';
import { QuestionController } from './controllers/question.controller';
import { GameController } from './controllers/game.controller';
import { AdminController } from './controllers/admin.controller';
import { VotingController } from './controllers/voting.controller';

// Gateways
import { GameGateway } from './gateways/game.gateway';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([Participant, Question, ParticipantAnswer, VotingSession, Vote]),
  ],
  controllers: [ParticipantController, QuestionController, GameController, AdminController, VotingController],
  providers: [ParticipantService, QuestionService, GameService, AdminService, VotingService, GameGateway],
})
export class AppModule {} 