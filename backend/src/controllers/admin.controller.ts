import { Controller, Post, Body, Get, Headers, ValidationPipe } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { AdminLoginDto } from '../dto/admin-login.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
} 