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
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { CreateResidentDto, UpdateResidentDto, ResidentResponseDto } from 'sevacare-shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('residents')
@UseGuards(JwtAuthGuard)
export class ResidentsController {
  constructor(private residentsService: ResidentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Request() req, @Body() createResidentDto: CreateResidentDto): Promise<ResidentResponseDto> {
    return this.residentsService.create(req.user.userId, createResidentDto);
  }

  @Get()
  findAll(@Request() req): Promise<ResidentResponseDto[]> {
    return this.residentsService.findAll(req.user.userId);
  }

  @Get('search')
  search(@Request() req, @Query('q') query: string): Promise<ResidentResponseDto[]> {
    if (!query) {
      return this.residentsService.findAll(req.user.userId);
    }
    return this.residentsService.search(req.user.userId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req): Promise<ResidentResponseDto> {
    return this.residentsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateResidentDto: UpdateResidentDto,
  ): Promise<ResidentResponseDto> {
    return this.residentsService.update(id, req.user.userId, updateResidentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.residentsService.remove(id, req.user.userId);
  }
}
