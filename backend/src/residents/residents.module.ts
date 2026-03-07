import { Module } from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { ResidentsController } from './residents.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ResidentsController],
  providers: [ResidentsService, PrismaService],
  exports: [ResidentsService],
})
export class ResidentsModule {}
