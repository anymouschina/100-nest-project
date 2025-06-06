import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AppConfigService } from '../../config/config.service';
import { DatabaseService } from '../../database/database.service';
import { JwtPayload } from '../auth.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: AppConfigService,
    private readonly databaseService: DatabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwtSecret,
      passReqToCallback: true, // Pass request to validate method
    });
  }

  /**
   * Validate the JWT payload and find the user
   * 
   * @param req - Express request object
   * @param payload - JWT payload containing user info
   * @returns User object if valid, throws UnauthorizedException if invalid
   */
  async validate(req: Request, payload: JwtPayload) {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid token format');
    }
    
    const token = authHeader.split(' ')[1];
    
    // Check if token is blacklisted
    const blacklistedToken = await this.databaseService.blacklistedToken.findUnique({
      where: { token },
    });
    
    if (blacklistedToken) {
      throw new UnauthorizedException('Token has been revoked');
    }
    
    // Find user
    const user = await this.databaseService.user.findUnique({
      where: { userId: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Strip sensitive information
    delete user.password;

    return user;
  }
} 