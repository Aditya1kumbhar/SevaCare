import { IsString, IsOptional } from 'class-validator';

export class CreateMedicationDto {
  @IsString()
  name: string;

  @IsString()
  dose: string;

  @IsString()
  frequency: string;

  @IsString()
  time: string;
}

export class UpdateMedicationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  dose?: string;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsString()
  time?: string;
}

export class MedicationResponseDto {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  time: string;
  createdAt: Date;
  updatedAt: Date;
}
