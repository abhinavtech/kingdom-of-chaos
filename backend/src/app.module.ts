import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';

// Entities
import { Participant } from './entities/participant.entity';
import { Question } from './entities/question.entity';
import { ParticipantAnswer } from './entities/participant-answer.entity';

// Services
import { ParticipantService } from './services/participant.service';
import { QuestionService } from './services/question.service';
import { GameService } from './services/game.service';
import { AdminService } from './services/admin.service';

// Controllers
import { ParticipantController } from './controllers/participant.controller';
import { QuestionController } from './controllers/question.controller';
import { GameController } from './controllers/game.controller';
import { AdminController } from './controllers/admin.controller';

// Gateways
import { GameGateway } from './gateways/game.gateway';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([Participant, Question, ParticipantAnswer]),
  ],
  controllers: [ParticipantController, QuestionController, GameController, AdminController],
  providers: [ParticipantService, QuestionService, GameService, AdminService, GameGateway],
})
export class AppModule {} 