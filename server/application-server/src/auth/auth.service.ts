import { Injectable, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { Cron } from '@nestjs/schedule';

export interface JwtPayload {
  sub: number;      // User ID
  openId?: string;  // WeChat openId
  name?: string;    // Username
  iat?: number;     // Issued at
  exp?: number;     // Expiration time
}

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
    private readonly databaseService: DatabaseService,
  ) {}

  async onModuleInit() {
    // Clean up expired blacklisted tokens on startup
    await this.cleanupExpiredTokens();
  }

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
      // Check if the token is blacklisted
      const blacklistedToken = await this.databaseService.blacklistedToken.findUnique({
        where: { token },
      });
      
      if (blacklistedToken) {
        return null;
      }
      
      return this.jwtService.verify<JwtPayload>(token);
    } catch (error) {
      return null;
    }
  }

  /**
   * Blacklist a token (logout)
   * 
   * @param token JWT token string
   * @param userId User ID
   * @returns True if token was blacklisted, false otherwise
   */
  async blacklistToken(token: string, userId: number): Promise<boolean> {
    try {
      // Decode token without verifying to get expiration time
      const decoded = this.jwtService.decode(token) as JwtPayload;
      
      if (!decoded || !decoded.exp) {
        return false;
      }
      
      // Convert exp timestamp to Date object
      const expiresAt = new Date(decoded.exp * 1000);
      
      // Add token to blacklist
      await this.databaseService.blacklistedToken.create({
        data: {
          token,
          userId,
          expiresAt,
        },
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Hash password using bcrypt
   * @param password Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Validate password against hash
   * @param password Plain text password
   * @param hash Hashed password
   * @returns True if password matches, false otherwise
   */
  async validatePassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = require('bcrypt');
    return bcrypt.compare(password, hash);
  }

  /**
   * Clean up expired blacklisted tokens
   * Runs every day at midnight
   */
  @Cron('0 0 * * *')
  async cleanupExpiredTokens() {
    const now = new Date();
    
    await this.databaseService.blacklistedToken.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });
  }
} 