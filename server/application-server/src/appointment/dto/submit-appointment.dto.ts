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

  @IsString()
  @Type(() => String)
  sceneType: string | string[];

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
  
  @IsString()
  @IsOptional()
  description?: string;
  
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];
} 