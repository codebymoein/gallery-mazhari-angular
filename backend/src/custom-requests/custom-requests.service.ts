import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { getPublicBackendUrl } from '../config/public-url';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCustomRequestDto, UpdateCustomRequestDto } from './dto/custom-request.dto';
import { CustomRequestEntity } from './entities/custom-request.entity';

type UploadedImage = { buffer: Buffer; mimetype: string; size: number };

@Injectable()
export class CustomRequestsService {
  constructor(
    @InjectRepository(CustomRequestEntity) private readonly repo: Repository<CustomRequestEntity>,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateCustomRequestDto, images: UploadedImage[]) {
    if (dto.website) return { accepted: true };
    const imageUrls = this.persistImages(images || []);
    const record = await this.repo.save(this.repo.create({
      type: dto.type,
      fullName: dto.fullName?.trim() || '',
      phone: dto.phone,
      email: dto.email?.trim().toLowerCase() || null,
      city: dto.city?.trim() || null,
      ceremonyDate: dto.ceremonyDate || null,
      contactTime: dto.contactTime || 'anytime',
      preferredContact: dto.preferredContact || 'phone',
      modelTitle: dto.modelTitle?.trim() || '',
      description: dto.description?.trim() || '',
      color: dto.color?.trim() || null,
      fabric: dto.fabric?.trim() || null,
      sizeOrLength: dto.sizeOrLength?.trim() || null,
      budget: dto.budget?.trim() || null,
      imageUrls,
      status: 'new',
      adminNote: null,
    }));
    const label = record.type === 'veil' ? 'تور سر سفارشی' : 'لباس سفارشی';
    await this.notifications.notify('custom-request.created', [
      `🧵 درخواست ${label} جدید`,
      `شناسه: ${record.id}`,
      `نام: ${record.fullName}`,
      `موبایل: ${record.phone}`,
      `ایمیل: ${record.email || '-'}`,
      `شهر: ${record.city || '-'}`,
      `تاریخ مراسم: ${record.ceremonyDate || '-'}`,
      `زمان تماس: ${this.contactTimeLabel(record.contactTime)}`,
      `روش تماس: ${record.preferredContact}`,
      `عنوان مدل: ${record.modelTitle}`,
      `رنگ: ${record.color || '-'}`,
      `جنس/پارچه: ${record.fabric || '-'}`,
      `${record.type === 'veil' ? 'طول تور' : 'سایز/اندازه‌ها'}: ${record.sizeOrLength || '-'}`,
      `بودجه: ${record.budget || '-'}`,
      `توضیحات: ${record.description}`,
      `تعداد تصاویر: ${record.imageUrls?.length || 0}`,
      ...(record.imageUrls || []).map((url) => `تصویر: ${url}`),
    ].join('\n'), { customRequestId: record.id, type: record.type, phone: record.phone });
    return record;
  }

  list() { return this.repo.find({ order: { createdAt: 'DESC' }, take: 500 }); }

  async update(id: string, dto: UpdateCustomRequestDto) {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) throw new NotFoundException('custom_request_not_found');
    if (dto.status !== undefined) record.status = dto.status;
    if (dto.adminNote !== undefined) record.adminNote = dto.adminNote.trim() || null;
    return this.repo.save(record);
  }

  async remove(id: string) {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) throw new NotFoundException('custom_request_not_found');
    await this.repo.remove(record);
    return { deleted: true };
  }

  private persistImages(images: UploadedImage[]): string[] {
    const destination = join(process.cwd(), 'uploads', 'custom-requests');
    if (!existsSync(destination)) mkdirSync(destination, { recursive: true });
    const baseUrl = getPublicBackendUrl(this.config);
    const validated = images.slice(0, 5).map((image) => {
      if (image.size > 5 * 1024 * 1024) throw new BadRequestException('custom_request_image_too_large');
      const ext = this.detectExtension(image.buffer);
      if (!ext) throw new BadRequestException('custom_request_image_invalid');
      return { image, ext };
    });
    return validated.map(({ image, ext }) => {
      const filename = `${Date.now()}-${randomUUID()}.${ext}`;
      writeFileSync(join(destination, filename), image.buffer);
      return `${baseUrl}/uploads/custom-requests/${filename}`;
    });
  }

  private detectExtension(buffer: Buffer): 'jpg' | 'png' | 'webp' | null {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
    if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
    if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
    return null;
  }

  private contactTimeLabel(value: string): string {
    return ({ anytime: 'هر زمان', morning: 'صبح', afternoon: 'ظهر', evening: 'عصر' } as Record<string, string>)[value] || value;
  }
}
