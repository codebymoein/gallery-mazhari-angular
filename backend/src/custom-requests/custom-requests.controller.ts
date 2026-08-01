import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { CreateCustomRequestDto, UpdateCustomRequestDto } from './dto/custom-request.dto';
import { CustomRequestsService } from './custom-requests.service';

interface BufferedUpload { buffer: Buffer; mimetype: string; size: number }

@Controller('custom-requests')
export class CustomRequestsController {
  constructor(private readonly service: CustomRequestsService) {}

  @Post()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 5 }], { limits: { fileSize: 5 * 1024 * 1024, files: 5 } }))
  create(@Body() dto: CreateCustomRequestDto, @UploadedFiles() files?: { images?: BufferedUpload[] }) {
    return this.service.create(dto, files?.images || []);
  }

  @Get() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN, UserRole.STAFF)
  list() { return this.service.list(); }

  @Patch(':id') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN, UserRole.STAFF)
  update(@Param('id') id: string, @Body() dto: UpdateCustomRequestDto) { return this.service.update(id, dto); }

  @Delete(':id') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
