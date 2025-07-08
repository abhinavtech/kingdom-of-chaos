import { Controller, Post, Get, Body, Param, Headers, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { PollService } from '../services/poll.service';
import { AdminService } from '../services/admin.service';
import { CreatePollDto } from '../dto/create-poll.dto';
import { SubmitRankingsDto } from '../dto/submit-rankings.dto';

@Controller('poll')
export class PollController {
  constructor(
    private readonly pollService: PollService,
    private readonly adminService: AdminService,
  ) {}

  @Post('create')
  async createPoll(
    @Headers('authorization') authorization: string,
    @Body(ValidationPipe) createPollDto: CreatePollDto,
  ) {
    // Validate admin token
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new HttpException('No token provided', HttpStatus.UNAUTHORIZED);
    }

    const token = authorization.substring(7);
    const isValid = await this.adminService.validateToken(token);
    
    if (!isValid) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }

    try {
      const poll = await this.pollService.createPoll(createPollDto);
      return {
        success: true,
        poll,
        message: 'Poll created successfully',
      };
    } catch (error) {
      throw new HttpException('Failed to create poll', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('activate/:id')
  async activatePoll(
    @Headers('authorization') authorization: string,
    @Param('id') pollId: string,
  ) {
    // Validate admin token
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new HttpException('No token provided', HttpStatus.UNAUTHORIZED);
    }

    const token = authorization.substring(7);
    const isValid = await this.adminService.validateToken(token);
    
    if (!isValid) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }

    try {
      const poll = await this.pollService.activatePoll(pollId);
      return {
        success: true,
        poll,
        message: 'Poll activated successfully',
      };
    } catch (error) {
      throw new HttpException('Failed to activate poll', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('active')
  async getActivePoll() {
    try {
      const poll = await this.pollService.getActivePoll();
      return {
        success: true,
        poll,
      };
    } catch (error) {
      throw new HttpException('Failed to get active poll', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('all')
  async getAllPolls(@Headers('authorization') authorization: string) {
    // Validate admin token
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new HttpException('No token provided', HttpStatus.UNAUTHORIZED);
    }

    const token = authorization.substring(7);
    const isValid = await this.adminService.validateToken(token);
    
    if (!isValid) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }

    try {
      const polls = await this.pollService.getAllPolls();
      return {
        success: true,
        polls,
      };
    } catch (error) {
      throw new HttpException('Failed to get polls', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('submit-rankings')
  async submitRankings(@Body(ValidationPipe) submitRankingsDto: SubmitRankingsDto) {
    try {
      const result = await this.pollService.submitRankings(submitRankingsDto);
      return result;
    } catch (error) {
      throw new HttpException('Failed to submit rankings', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('results/:id')
  async getPollResults(@Param('id') pollId: string) {
    try {
      const results = await this.pollService.getPollResults(pollId);
      return {
        success: true,
        results,
      };
    } catch (error) {
      throw new HttpException('Failed to get poll results', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('end/:id')
  async endPoll(
    @Headers('authorization') authorization: string,
    @Param('id') pollId: string,
  ) {
    // Validate admin token
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new HttpException('No token provided', HttpStatus.UNAUTHORIZED);
    }

    const token = authorization.substring(7);
    const isValid = await this.adminService.validateToken(token);
    
    if (!isValid) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }

    try {
      await this.pollService.endPoll(pollId);
      return {
        success: true,
        message: 'Poll ended successfully',
      };
    } catch (error) {
      throw new HttpException('Failed to end poll', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('delete/:id')
  async deletePoll(
    @Headers('authorization') authorization: string,
    @Param('id') pollId: string,
  ) {
    // Validate admin token
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new HttpException('No token provided', HttpStatus.UNAUTHORIZED);
    }

    const token = authorization.substring(7);
    const isValid = await this.adminService.validateToken(token);
    
    if (!isValid) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }

    try {
      const result = await this.pollService.deletePoll(pollId);
      return result;
    } catch (error) {
      throw new HttpException('Failed to delete poll', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}