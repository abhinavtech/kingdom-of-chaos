import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participant } from '../entities/participant.entity';
import { CreateParticipantDto } from '../dto/create-participant.dto';
import { ParticipantLoginDto } from '../dto/participant-login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ParticipantService {
  constructor(
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
  ) {}

  async create(createParticipantDto: CreateParticipantDto): Promise<Participant> {
    // Check if participant with this name already exists
    const existingParticipant = await this.participantRepository.findOne({
      where: { name: createParticipantDto.name },
    });
    
    if (existingParticipant) {
      throw new Error('Participant with this name already exists. Please login instead.');
    }
    
    const hashedPassword = await bcrypt.hash(createParticipantDto.password, 10);
    const participant = this.participantRepository.create({
      ...createParticipantDto,
      password: hashedPassword,
    });
    return this.participantRepository.save(participant);
  }

  async login(participantLoginDto: ParticipantLoginDto): Promise<Participant | null> {
    const { name, password } = participantLoginDto;
    
    // Find participant by name
    const participant = await this.participantRepository.findOne({
      where: { name },
      relations: ['answers'],
    });
    
    if (!participant) {
      return null;
    }
    
    // Validate password
    const isPasswordValid = await bcrypt.compare(password, participant.password);
    if (!isPasswordValid) {
      return null;
    }
    
    return participant;
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

  async validatePassword(id: string, password: string): Promise<boolean> {
    const participant = await this.participantRepository.findOne({ where: { id } });
    if (!participant) return false;
    return bcrypt.compare(password, participant.password);
  }
} 