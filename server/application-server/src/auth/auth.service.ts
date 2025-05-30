import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '../config/config.service';

export interface JwtPayload {
  sub: number;      // User ID
  openId?: string;  // WeChat openId
  name?: string;    // Username
  iat?: number;     // Issued at
  exp?: number;     // Expiration time
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) {}

  /**
   * Generate a JWT token for a user
   * 
   * @param userId User ID
   * @param payload Additional payload data
   * @returns JWT token string
   */
  async generateToken(userId: number, payload: Partial<JwtPayload> = {}): Promise<string> {
    const tokenPayload: JwtPayload = {
      sub: userId,
      ...payload,
    };

    return this.jwtService.sign(tokenPayload);
  }

  /**
   * Verify and decode a JWT token
   * 
   * @param token JWT token string
   * @returns Decoded payload or null if invalid
   */
  async verifyToken(token: string): Promise<JwtPayload | null> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch (error) {
      return null;
    }
  }
} 