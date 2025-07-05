import { Controller, Get, Post, Body, Param, ValidationPipe } from '@nestjs/common';
import { ParticipantService } from '../services/participant.service';
import { CreateParticipantDto } from '../dto/create-participant.dto';

@Controller('participants')
export class ParticipantController {
  constructor(private readonly participantService: ParticipantService) {}

  @Post()
  create(@Body(ValidationPipe) createParticipantDto: CreateParticipantDto) {
    return this.participantService.create(createParticipantDto);
  }

  @Get()
  findAll() {
    return this.participantService.findAll();
  }

  @Get('leaderboard')
  getLeaderboard() {
    return this.participantService.getLeaderboard();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.participantService.findOne(id);
  }
} 