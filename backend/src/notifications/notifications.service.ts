import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateNotificationSettingsDto } from './dto/notification-settings.dto';
import { NotificationDeliveryEntity } from './entities/notification-delivery.entity';
import { NotificationSettingsEntity } from './entities/notification-settings.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationSettingsEntity)
    private readonly settingsRepo: Repository<NotificationSettingsEntity>,
    @InjectRepository(NotificationDeliveryEntity)
    private readonly deliveries: Repository<NotificationDeliveryEntity>,
  ) {}

  async adminSettings() {
    const value = await this.getSettings();
    return {
      ...value,
      telegramBotToken: value.telegramBotToken ? '••••••••' : '',
      smsApiKey: value.smsApiKey ? '••••••••' : '',
    };
  }

  async updateSettings(dto: UpdateNotificationSettingsDto) {
    const current = await this.getSettings();
    current.enabled = dto.enabled;
    current.mode = dto.mode;
    current.telegramChatIds = this.cleanList(dto.telegramChatIds);
    current.smsRecipients = this.cleanList(dto.smsRecipients);
    current.smsApiUrl = dto.smsApiUrl?.trim() || null;
    current.smsSender = dto.smsSender?.trim() || null;
    current.smsAuthHeader = dto.smsAuthHeader?.trim() || 'Authorization';
    current.smsAuthScheme = dto.smsAuthScheme?.trim() || 'Bearer';
    current.timeoutMs = dto.timeoutMs;
    if (dto.telegramBotToken && !dto.telegramBotToken.includes('•'))
      current.telegramBotToken = dto.telegramBotToken.trim();
    if (dto.smsApiKey && !dto.smsApiKey.includes('•'))
      current.smsApiKey = dto.smsApiKey.trim();
    if (
      current.enabled &&
      ['telegram', 'both'].includes(current.mode) &&
      (!current.telegramBotToken || !current.telegramChatIds.length)
    ) {
      throw new BadRequestException('telegram_configuration_incomplete');
    }
    if (
      current.enabled &&
      ['sms', 'both'].includes(current.mode) &&
      (!current.smsApiUrl || !current.smsRecipients.length)
    ) {
      throw new BadRequestException('sms_configuration_incomplete');
    }
    if (
      current.enabled &&
      current.mode === 'auto' &&
      (!current.telegramBotToken ||
        !current.telegramChatIds.length ||
        !current.smsApiUrl ||
        !current.smsRecipients.length)
    ) {
      throw new BadRequestException('auto_fallback_configuration_incomplete');
    }
    await this.settingsRepo.save(current);
    return this.adminSettings();
  }

  async test(channel: 'telegram' | 'sms') {
    const settings = await this.getSettings();
    const message = `✅ تست اعلان گالری مظهری\n${new Date().toLocaleString('fa-IR')}`;
    if (channel === 'telegram') await this.sendTelegram(settings, message);
    else await this.sendSms(settings, message);
    return { sent: true, channel };
  }

  async notify(
    eventType: string,
    message: string,
    context?: Record<string, unknown>,
  ): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.enabled || settings.mode === 'disabled') return;
    const delivery = await this.deliveries.save(
      this.deliveries.create({ eventType, message, context: context ?? null }),
    );
    const channels: string[] = [];
    try {
      delivery.attempts += 1;
      if (settings.mode === 'sms') {
        await this.sendSms(settings, message);
        channels.push('sms');
      } else if (settings.mode === 'both') {
        const results = await Promise.allSettled([
          this.sendTelegram(settings, message),
          this.sendSms(settings, message),
        ]);
        if (results[0].status === 'fulfilled') channels.push('telegram');
        if (results[1].status === 'fulfilled') channels.push('sms');
        if (!channels.length)
          throw new Error('all_notification_channels_failed');
      } else {
        try {
          await this.sendTelegram(settings, message);
          channels.push('telegram');
        } catch (telegramError) {
          if (settings.mode === 'telegram') throw telegramError;
          await this.sendSms(settings, message);
          channels.push('sms-fallback');
        }
      }
      delivery.status = 'sent';
      delivery.channel = channels.join(',');
      delivery.lastError = null;
    } catch (error) {
      delivery.status = 'failed';
      delivery.lastError = this.errorText(error).slice(0, 4000);
    }
    await this.deliveries.save(delivery);
  }

  private async sendTelegram(
    settings: NotificationSettingsEntity,
    message: string,
  ): Promise<void> {
    if (!settings.telegramBotToken || !settings.telegramChatIds?.length)
      throw new Error('telegram_not_configured');
    for (const chatId of settings.telegramChatIds) {
      await this.postJson(
        `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`,
        {
          chat_id: chatId,
          text: message,
          disable_web_page_preview: true,
        },
        {},
        settings.timeoutMs,
      );
    }
  }

  private async sendSms(
    settings: NotificationSettingsEntity,
    message: string,
  ): Promise<void> {
    if (!settings.smsApiUrl || !settings.smsRecipients?.length)
      throw new Error('sms_not_configured');
    const headers: Record<string, string> = {};
    if (settings.smsApiKey)
      headers[settings.smsAuthHeader] =
        `${settings.smsAuthScheme} ${settings.smsApiKey}`.trim();
    for (const to of settings.smsRecipients) {
      await this.postJson(
        settings.smsApiUrl,
        {
          to,
          text: message.slice(0, 1400),
          sender: settings.smsSender || undefined,
        },
        headers,
        settings.timeoutMs,
      );
    }
  }

  private async postJson(
    url: string,
    body: unknown,
    headers: Record<string, string>,
    timeoutMs: number,
  ): Promise<void> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok)
      throw new Error(
        `notification_http_${response.status}:${(await response.text()).slice(0, 500)}`,
      );
  }

  private async getSettings(): Promise<NotificationSettingsEntity> {
    return (
      (await this.settingsRepo.findOne({ where: { id: 1 } })) ??
      this.settingsRepo.create({
        id: 1,
        enabled: false,
        mode: 'disabled',
        telegramBotToken: null,
        telegramChatIds: [],
        smsApiUrl: null,
        smsApiKey: null,
        smsSender: null,
        smsRecipients: [],
        smsAuthHeader: 'Authorization',
        smsAuthScheme: 'Bearer',
        timeoutMs: 8000,
      })
    );
  }
  private cleanList(values: string[]): string[] {
    return [
      ...new Set((values || []).map((value) => value.trim()).filter(Boolean)),
    ].slice(0, 20);
  }
  private errorText(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
