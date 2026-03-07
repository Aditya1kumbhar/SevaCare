import { IsString, IsInt, IsArray, IsOptional, IsBoolean, IsPhoneNumber, Min, Max } from 'class-validator';
import { MedicationResponseDto } from './medication.dto';

export class CreateResidentDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  @Max(150)
  age: number;

  @IsString()
  gender: string; // Male, Female, Other

  @IsArray()
  @IsString({ each: true })
  chronicIllnesses: string[];

  @IsString()
  mobilityStatus: string;

  @IsBoolean()
  memoryLoss: boolean;

  @IsBoolean()
  anxietyDepression: boolean;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsPhoneNumber('IN')
  emergencyContactPhone?: string;
}

export class UpdateResidentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(150)
  age?: number;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chronicIllnesses?: string[];

  @IsOptional()
  @IsString()
  mobilityStatus?: string;

  @IsOptional()
  @IsBoolean()
  memoryLoss?: boolean;

  @IsOptional()
  @IsBoolean()
  anxietyDepression?: boolean;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsPhoneNumber('IN')
  emergencyContactPhone?: string;
}

export class ResidentResponseDto {
  id: string;
  name: string;
  age: number;
  gender: string;
  chronicIllnesses: string[];
  mobilityStatus: string;
  memoryLoss: boolean;
  anxietyDepression: boolean;
  allergies: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  medications: MedicationResponseDto[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}
