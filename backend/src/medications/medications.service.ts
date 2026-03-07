import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicationDto, UpdateMedicationDto, MedicationResponseDto } from 'sevacare-shared';

@Injectable()
export class MedicationsService {
  constructor(private prisma: PrismaService) {}

  async create(
    residentId: string,
    userId: string,
    createMedicationDto: CreateMedicationDto,
  ): Promise<MedicationResponseDto> {
    // Verify resident belongs to user
    const resident = await this.prisma.resident.findUnique({
      where: { id: residentId },
    });

    if (!resident || resident.userId !== userId) {
      throw new NotFoundException('Resident not found');
    }

    return this.prisma.medication.create({
      data: {
        ...createMedicationDto,
        residentId,
      },
    });
  }

  async findByResident(residentId: string, userId: string): Promise<MedicationResponseDto[]> {
    const resident = await this.prisma.resident.findUnique({
      where: { id: residentId },
    });

    if (!resident || resident.userId !== userId) {
      throw new NotFoundException('Resident not found');
    }

    return this.prisma.medication.findMany({
      where: { residentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    id: string,
    residentId: string,
    userId: string,
    updateMedicationDto: UpdateMedicationDto,
  ): Promise<MedicationResponseDto> {
    const resident = await this.prisma.resident.findUnique({
      where: { id: residentId },
    });

    if (!resident || resident.userId !== userId) {
      throw new NotFoundException('Resident not found');
    }

    const medication = await this.prisma.medication.findUnique({
      where: { id },
    });

    if (!medication || medication.residentId !== residentId) {
      throw new NotFoundException('Medication not found');
    }

    return this.prisma.medication.update({
      where: { id },
      data: updateMedicationDto,
    });
  }

  async remove(id: string, residentId: string, userId: string): Promise<void> {
    const resident = await this.prisma.resident.findUnique({
      where: { id: residentId },
    });

    if (!resident || resident.userId !== userId) {
      throw new NotFoundException('Resident not found');
    }

    const medication = await this.prisma.medication.findUnique({
      where: { id },
    });

    if (!medication || medication.residentId !== residentId) {
      throw new NotFoundException('Medication not found');
    }

    await this.prisma.medication.delete({
      where: { id },
    });
  }
}
