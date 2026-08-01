import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class RecoveryMailService {
  private transporter: Transporter | null = null;
  constructor(private readonly config: ConfigService) {}

  async sendResetLink(
    accountEmail: string,
    resetUrl: string,
    expiresMinutes: number,
  ): Promise<void> {
    const recipient = this.config.get<string>('ADMIN_RECOVERY_EMAIL');
    if (!recipient)
      throw new ServiceUnavailableException('recovery_email_not_configured');
    await this.transport().sendMail({
      from:
        this.config.get<string>('SMTP_FROM') ||
        this.config.get<string>('SMTP_USER'),
      to: recipient,
      subject: 'لینک بازیابی رمز پنل گالری مظهری',
      text: `برای حساب ${accountEmail} درخواست بازیابی ثبت شده است.\n\n${resetUrl}\n\nاین لینک ${expiresMinutes} دقیقه اعتبار دارد و فقط یک‌بار قابل استفاده است.`,
      html: `<div dir="rtl" style="font-family:Tahoma,Arial"><h2>بازیابی رمز پنل</h2><p>برای حساب <b dir="ltr">${this.escape(accountEmail)}</b> درخواست بازیابی ثبت شده است.</p><p><a href="${this.escape(resetUrl)}">تعیین رمز جدید</a></p><p>این لینک ${expiresMinutes} دقیقه اعتبار دارد و فقط یک‌بار قابل استفاده است.</p></div>`,
    });
  }

  private transport(): Transporter {
    if (this.transporter) return this.transporter;
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASSWORD');
    if (!host || !user || !pass)
      throw new ServiceUnavailableException('smtp_not_configured');
    const port = Number(this.config.get<string>('SMTP_PORT') || 587);
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 10_000,
      socketTimeout: 15_000,
    });
    return this.transporter;
  }
  private escape(value: string): string {
    return value.replace(
      /[&<>"']/g,
      (char) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[char] || char,
    );
  }
}
