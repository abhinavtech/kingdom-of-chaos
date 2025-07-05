import { Controller, Post, Body, Get, Headers, ValidationPipe, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { QuestionService } from '../services/question.service';
import { AdminLoginDto } from '../dto/admin-login.dto';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly questionService: QuestionService,
  ) {}

  @Post('login')
  async login(@Body(ValidationPipe) adminLoginDto: AdminLoginDto) {
    return this.adminService.login(adminLoginDto);
  }

  @Get('validate')
  async validateToken(@Headers('authorization') authorization: string) {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return { valid: false, message: 'No token provided' };
    }

    const token = authorization.substring(7); // Remove 'Bearer ' prefix
    const isValid = await this.adminService.validateToken(token);
    
    return { 
      valid: isValid, 
      message: isValid ? 'Token is valid' : 'Invalid token' 
    };
  }

  @Delete('users/all')
  async deleteAllUsers(@Headers('authorization') authorization: string) {
    // Validate admin token
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new HttpException('No token provided', HttpStatus.UNAUTHORIZED);
    }

    const token = authorization.substring(7); // Remove 'Bearer ' prefix
    const isValid = await this.adminService.validateToken(token);
    
    if (!isValid) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }

    try {
      return await this.adminService.deleteAllUsers();
    } catch (error) {
      throw new HttpException('Failed to delete users', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('questions/all')
  async deleteAllQuestions(@Headers('authorization') authorization: string) {
    // Validate admin token
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new HttpException('No token provided', HttpStatus.UNAUTHORIZED);
    }

    const token = authorization.substring(7); // Remove 'Bearer ' prefix
    const isValid = await this.adminService.validateToken(token);
    
    if (!isValid) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }

    try {
      return await this.adminService.deleteAllQuestions();
    } catch (error) {
      throw new HttpException('Failed to delete questions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('questions/bulk')
  async addQuestions(
    @Headers('authorization') authorization: string,
    @Body() questions: Array<{
      questionText: string;
      options: Record<string, string>;
      correctAnswer: string;
      points?: number;
    }>
  ) {
    // Validate admin token
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new HttpException('No token provided', HttpStatus.UNAUTHORIZED);
    }

    const token = authorization.substring(7); // Remove 'Bearer ' prefix
    const isValid = await this.adminService.validateToken(token);
    
    if (!isValid) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }

    try {
      return await this.adminService.addQuestions(questions);
    } catch (error) {
      throw new HttpException('Failed to add questions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('questions/all')
  async getAllQuestions(@Headers('authorization') authorization: string) {
    // Validate admin token
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new HttpException('No token provided', HttpStatus.UNAUTHORIZED);
    }

    const token = authorization.substring(7); // Remove 'Bearer ' prefix
    const isValid = await this.adminService.validateToken(token);
    
    if (!isValid) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }

    try {
      return await this.questionService.findAllQuestions();
    } catch (error) {
      throw new HttpException('Failed to get questions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 