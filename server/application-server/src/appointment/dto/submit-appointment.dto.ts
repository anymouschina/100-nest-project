import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitAppointmentDto {
  @IsString()
  @IsNotEmpty()
  serviceType: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  region: string;

  @IsString()
  address?: string;

  @IsArray()
  @IsString({ each: true })
  sceneType: string[];

  @IsString()
  @IsNotEmpty()
  location: string;
  
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;
  
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;
} 