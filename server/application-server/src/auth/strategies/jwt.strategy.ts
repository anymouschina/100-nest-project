import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AppConfigService } from '../../config/config.service';
import { DatabaseService } from '../../database/database.service';
import { JwtPayload } from '../auth.service';

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
    });
  }

  /**
   * Validate the JWT payload and find the user
   * 
   * @param payload JWT payload containing user info
   * @returns User object if valid, throws UnauthorizedException if invalid
   */
  async validate(payload: JwtPayload) {
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