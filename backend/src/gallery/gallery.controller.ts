import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { GalleryService } from './gallery.service';
import { CreateGalleryItemDto } from './dto/create-gallery-item.dto';
import { QueryGalleryDto } from './dto/query-gallery.dto';
import { UpdateGalleryItemDto } from './dto/update-gallery-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { getPublicBackendUrl } from '../config/public-url';
import { Throttle } from '@nestjs/throttler';

@Controller('gallery')
export class GalleryController {
  constructor(
    private readonly galleryService: GalleryService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  list(@Query() query: QueryGalleryDto) {
    return this.galleryService.getAll(query);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.galleryService.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  create(@Body() dto: CreateGalleryItemDto) {
    return this.galleryService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  update(@Param('id') id: string, @Body() dto: UpdateGalleryItemDto) {
    return this.galleryService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  remove(@Param('id') id: string) {
    return this.galleryService.remove(id);
  }

  @Post('upload')
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImage(@UploadedFile() file: { buffer: Buffer } | undefined) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    let format: string | undefined;
    try {
      format = (await sharp(file.buffer, { failOn: 'error' }).metadata())
        .format;
    } catch {
      throw new BadRequestException('The uploaded file is not a valid image');
    }

    const extensions: Record<string, string> = {
      jpeg: '.jpg',
      png: '.png',
      webp: '.webp',
      avif: '.avif',
    };
    const extension = format ? extensions[format] : undefined;
    if (!extension) {
      throw new BadRequestException('Only image files are allowed');
    }

    const filename = `${randomUUID()}${extension}`;
    const destination = join(process.cwd(), 'uploads');
    await mkdir(destination, { recursive: true });
    await writeFile(join(destination, filename), file.buffer, { flag: 'wx' });

    return {
      imageUrl: `${getPublicBackendUrl(this.config)}/uploads/${filename}`,
      filename,
    };
  }
}
