import { Module } from '@nestjs/common';
import { MedicationsService } from './medications.service';
import { MedicationsController } from './medications.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [MedicationsController],
  providers: [MedicationsService, PrismaService],
  exports: [MedicationsService],
})
export class MedicationsModule {}
