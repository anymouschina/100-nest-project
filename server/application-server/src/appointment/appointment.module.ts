import { Module } from '@nestjs/common';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { DatabaseService } from '../database/database.service';

@Module({
  imports: [],
  controllers: [AppointmentController],
  providers: [AppointmentService, DatabaseService],
  exports: [AppointmentService]
})
export class AppointmentModule {} 