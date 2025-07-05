import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participant } from '../entities/participant.entity';
import { CreateParticipantDto } from '../dto/create-participant.dto';

@Injectable()
export class ParticipantService {
  constructor(
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
  ) {}

  async create(createParticipantDto: CreateParticipantDto): Promise<Participant> {
    const participant = this.participantRepository.create(createParticipantDto);
    return this.participantRepository.save(participant);
  }

  async findAll(): Promise<Participant[]> {
    return this.participantRepository.find({
      relations: ['answers'],
      order: { score: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Participant> {
    return this.participantRepository.findOne({
      where: { id },
      relations: ['answers'],
    });
  }

  async updateScore(id: string, points: number): Promise<Participant> {
    await this.participantRepository.increment({ id }, 'score', points);
    return this.findOne(id);
  }

  async getLeaderboard(): Promise<Participant[]> {
    return this.participantRepository.find({
      order: { score: 'DESC' },
      take: 10,
    });
  }
} 