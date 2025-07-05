import { Injectable } from '@nestjs/common';
import { AdminLoginDto } from '../dto/admin-login.dto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AdminService {
  private readonly adminPassword = 'biggestlulli69';
  private readonly jwtSecret = 'kingdom-of-chaos-admin-secret-key';

  async login(adminLoginDto: AdminLoginDto): Promise<{ success: boolean; token?: string; message?: string }> {
    const { password } = adminLoginDto;

    if (password !== this.adminPassword) {
      return {
        success: false,
        message: 'Invalid password. Access denied.',
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        role: 'admin', 
        timestamp: Date.now() 
      },
      this.jwtSecret,
      { expiresIn: '24h' }
    );

    return {
      success: true,
      token,
      message: 'Authentication successful',
    };
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      return decoded.role === 'admin';
    } catch (error) {
      return false;
    }
  }
} 