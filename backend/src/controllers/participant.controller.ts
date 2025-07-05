import { Controller, Get, Post, Body, Param, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { ParticipantService } from '../services/participant.service';
import { CreateParticipantDto } from '../dto/create-participant.dto';
import { ParticipantLoginDto } from '../dto/participant-login.dto';

@Controller('participants')
export class ParticipantController {
  constructor(private readonly participantService: ParticipantService) {}

  @Post()
  async create(@Body(ValidationPipe) createParticipantDto: CreateParticipantDto) {
    try {
      return await this.participantService.create(createParticipantDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  async login(@Body(ValidationPipe) participantLoginDto: ParticipantLoginDto) {
    const participant = await this.participantService.login(participantLoginDto);
    if (!participant) {
      throw new HttpException('Invalid name or password', HttpStatus.UNAUTHORIZED);
    }
    return participant;
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