import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule } from '../config/config.module';
import { AppConfigService } from '../config/config.service';
import { DatabaseService } from "../database/database.service";
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from "../database/database.module";

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [
    DatabaseModule,ConfigModule],
      inject: [AppConfigService],
      useFactory: async (configService: AppConfigService) => ({
        secret: configService.jwtSecret,
        signOptions: {
          expiresIn: configService.jwtExpiresIn,
        },
      }),
    }),
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  providers: [AuthService, JwtStrategy, DatabaseService],
  exports: [AuthService],
})
export class AuthModule {} 