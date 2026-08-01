import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateConsultationDto,
  UpdateConsultationDto,
} from './dto/consultation.dto';
import { ConsultationEntity } from './entities/consultation.entity';

const contactLabels: Record<string, string> = {
  anytime: 'هر زمان',
  morning: 'صبح',
  afternoon: 'ظهر',
  evening: 'عصر',
};

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectRepository(ConsultationEntity)
    private readonly repo: Repository<ConsultationEntity>,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateConsultationDto) {
    if (dto.website) return { accepted: true };
    const record = await this.repo.save(
      this.repo.create({
        lastName: dto.lastName?.trim() || '',
        phone: dto.phone,
        ceremonyDate: dto.ceremonyDate || '',
        contactTime: dto.contactTime || 'anytime',
        message: dto.message?.trim() || null,
        source: dto.source || 'website',
        productName: dto.productName?.trim() || null,
        productId: dto.productId?.trim() || null,
        dreamItems: (dto.dreamItems || []).slice(0, 30),
        followUpTag: 'needs_followup',
        adminNote: null,
      }),
    );
    const dream =
      record.dreamItems
        ?.map((item) => `• ${item.name} (${item.productId})`)
        .join('\n') || 'ندارد';
    void this.notifications.notify(
      'consultation.created',
      [
        '💎 درخواست مشاوره جدید',
        `شناسه: ${record.id}`,
        `نام: ${record.lastName}`,
        `موبایل: ${record.phone}`,
        `تاریخ مراسم: ${record.ceremonyDate}`,
        `زمان تماس: ${contactLabels[record.contactTime] || record.contactTime}`,
        `محصول: ${record.productName || '-'} (${record.productId || '-'})`,
        `منبع: ${record.source}`,
        `توضیحات: ${record.message || '-'}`,
        `بوم رویایی:\n${dream}`,
      ].join('\n'),
      { consultationId: record.id, phone: record.phone },
    );
    return record;
  }

  list() {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: 500 });
  }
  async update(id: string, dto: UpdateConsultationDto) {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) throw new NotFoundException('consultation_not_found');
    if (dto.followUpTag !== undefined) record.followUpTag = dto.followUpTag;
    if (dto.adminNote !== undefined)
      record.adminNote = dto.adminNote.trim() || null;
    return this.repo.save(record);
  }
  async remove(id: string) {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) throw new NotFoundException('consultation_not_found');
    await this.repo.remove(record);
    return { deleted: true };
  }
}
