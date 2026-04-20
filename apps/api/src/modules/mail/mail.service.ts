import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true';
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
    } else {
      // Dev fallback: log emails to console instead of sending
      this.logger.warn('SMTP not configured — emails will be logged to console only');
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
    }
  }

  private get from(): string {
    const name = this.configService.get<string>('EMAIL_FROM_NAME', 'رحلات EV');
    const addr = this.configService.get<string>('EMAIL_FROM', 'noreply@evtrips.community');
    return `"${name}" <${addr}>`;
  }

  async sendVerificationEmail(to: string, fullName: string, token: string): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
    const link = `${appUrl}/verify-email?token=${token}`;

    await this.send({
      to,
      subject: 'تأكيد بريدك الإلكتروني — رحلات EV',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #22c55e;">مرحباً ${fullName} 👋</h2>
          <p>شكراً لتسجيلك في رحلات EV. انقر على الزر أدناه لتأكيد بريدك الإلكتروني:</p>
          <a href="${link}" style="display:inline-block;background:#22c55e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
            تأكيد البريد الإلكتروني
          </a>
          <p style="color:#666;font-size:13px;">الرابط صالح لمدة 24 ساعة. إذا لم تنشئ حساباً، تجاهل هذه الرسالة.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
          <p style="color:#999;font-size:12px;">رحلات EV — مجتمع السيارات الكهربائية في المملكة</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(to: string, fullName: string, token: string): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
    const link = `${appUrl}/reset-password?token=${token}`;

    await this.send({
      to,
      subject: 'إعادة تعيين كلمة المرور — رحلات EV',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #22c55e;">إعادة تعيين كلمة المرور</h2>
          <p>مرحباً ${fullName}، طلبت إعادة تعيين كلمة مرورك. انقر على الزر أدناه:</p>
          <a href="${link}" style="display:inline-block;background:#22c55e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
            إعادة تعيين كلمة المرور
          </a>
          <p style="color:#666;font-size:13px;">الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب هذا، تجاهل الرسالة.</p>
        </div>
      `,
    });
  }

  async sendTripApprovedEmail(to: string, fullName: string, tripTitle: string, tripSlug: string): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
    const link = `${appUrl}/trips/${tripSlug}`;

    await this.send({
      to,
      subject: 'تمت الموافقة على رحلتك ✅ — رحلات EV',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #22c55e;">تمت الموافقة على رحلتك! 🎉</h2>
          <p>مرحباً ${fullName}، رحلتك "<strong>${tripTitle}</strong>" منشورة الآن للجميع.</p>
          <a href="${link}" style="display:inline-block;background:#22c55e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
            عرض الرحلة
          </a>
        </div>
      `,
    });
  }

  async sendTripRejectedEmail(to: string, fullName: string, tripTitle: string, reason: string): Promise<void> {
    await this.send({
      to,
      subject: 'بخصوص رحلتك — رحلات EV',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #ef4444;">لم تُقبل رحلتك</h2>
          <p>مرحباً ${fullName}، رحلتك "<strong>${tripTitle}</strong>" لم تُقبل للسبب التالي:</p>
          <blockquote style="background:#fef2f2;border-right:4px solid #ef4444;padding:12px;margin:16px 0;border-radius:4px;">
            ${reason}
          </blockquote>
          <p>يمكنك تعديل الرحلة وإعادة إرسالها للمراجعة.</p>
        </div>
      `,
    });
  }

  private async send(options: { to: string; subject: string; html: string }): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      // In dev (jsonTransport), log the email body instead of sending
      if ((info as any).envelope === undefined && (info as any).message) {
        this.logger.debug(`[DEV EMAIL] To: ${options.to} | Subject: ${options.subject}`);
        this.logger.debug(`[DEV EMAIL] Body preview: ${options.html.replace(/<[^>]+>/g, '').slice(0, 100)}...`);
      } else {
        this.logger.log(`Email sent to ${options.to}: ${info.messageId}`);
      }
    } catch (error) {
      // Never throw — email failure should not crash the request
      this.logger.error(`Failed to send email to ${options.to}: ${(error as Error).message}`);
    }
  }
}
