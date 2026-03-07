import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MedicationsService } from './medications.service';
import { CreateMedicationDto, UpdateMedicationDto, MedicationResponseDto } from 'sevacare-shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('residents/:residentId/medications')
@UseGuards(JwtAuthGuard)
export class MedicationsController {
  constructor(private medicationsService: MedicationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('residentId') residentId: string,
    @Request() req,
    @Body() createMedicationDto: CreateMedicationDto,
  ): Promise<MedicationResponseDto> {
    return this.medicationsService.create(residentId, req.user.userId, createMedicationDto);
  }

  @Get()
  findByResident(@Param('residentId') residentId: string, @Request() req): Promise<MedicationResponseDto[]> {
    return this.medicationsService.findByResident(residentId, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('residentId') residentId: string,
    @Param('id') id: string,
    @Request() req,
    @Body() updateMedicationDto: UpdateMedicationDto,
  ): Promise<MedicationResponseDto> {
    return this.medicationsService.update(id, residentId, req.user.userId, updateMedicationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('residentId') residentId: string,
    @Param('id') id: string,
    @Request() req,
  ): Promise<void> {
    return this.medicationsService.remove(id, residentId, req.user.userId);
  }
}
