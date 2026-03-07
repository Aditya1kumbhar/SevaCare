import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResidentDto, UpdateResidentDto, ResidentResponseDto } from 'sevacare-shared';

@Injectable()
export class ResidentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createResidentDto: CreateResidentDto): Promise<ResidentResponseDto> {
    const resident = await this.prisma.resident.create({
      data: {
        ...createResidentDto,
        userId,
      },
      include: {
        medications: true,
      },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        residentId: resident.id,
        action: 'added_resident',
        details: `Resident ${resident.name} was added`,
      },
    });

    return resident;
  }

  async findAll(userId: string): Promise<ResidentResponseDto[]> {
    return this.prisma.resident.findMany({
      where: { userId },
      include: {
        medications: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string): Promise<ResidentResponseDto> {
    const resident = await this.prisma.resident.findUnique({
      where: { id },
      include: {
        medications: true,
        healthRecords: {
          orderBy: { dateRecorded: 'desc' },
          take: 10,
        },
      },
    });

    if (!resident || resident.userId !== userId) {
      throw new NotFoundException('Resident not found');
    }

    return resident;
  }

  async update(id: string, userId: string, updateResidentDto: UpdateResidentDto): Promise<ResidentResponseDto> {
    const resident = await this.prisma.resident.findUnique({
      where: { id },
    });

    if (!resident || resident.userId !== userId) {
      throw new NotFoundException('Resident not found');
    }

    const updated = await this.prisma.resident.update({
      where: { id },
      data: updateResidentDto,
      include: {
        medications: true,
      },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        residentId: id,
        action: 'updated_resident',
        details: `Resident ${resident.name} was updated`,
      },
    });

    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const resident = await this.prisma.resident.findUnique({
      where: { id },
    });

    if (!resident || resident.userId !== userId) {
      throw new NotFoundException('Resident not found');
    }

    await this.prisma.resident.delete({
      where: { id },
    });
  }

  async search(userId: string, query: string): Promise<ResidentResponseDto[]> {
    return this.prisma.resident.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { chronicIllnesses: { hasSome: [query] } },
        ],
      },
      include: {
        medications: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
