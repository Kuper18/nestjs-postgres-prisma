import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer';
import { AppConfigInterface } from 'src/interface/app.config.interface';
import { SendEmailInterface } from './interface/send-email.interface';

@Injectable()
export class MailService {
  private transporter: Transporter<SentMessageInfo>;

  constructor(
    private readonly configService: ConfigService<AppConfigInterface>,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow('MAIL_HOST'),
      port: this.configService.getOrThrow('MAIL_PORT'),
      auth: {
        user: this.configService.getOrThrow('MAIL_USER'),
        pass: this.configService.getOrThrow('MAIL_PASSWORD'),
      },
    });
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const url = this.buildUrl('auth/verify-email', token);
    await this.send({ to, subject: 'Verify your email address', html: url });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const url = this.buildUrl('auth/reset-password', token);
    await this.send({ to, subject: 'Reset your password', html: url });
  }

  private buildUrl(path: string, token: string): string {
    return `${this.configService.getOrThrow('CLIENT_URL')}/${path}?token=${token}`;
  }

  private async send(options: SendEmailInterface): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.getOrThrow('MAIL_FROM'),
        ...options,
      });
    } catch (error) {
      console.error('Mail error:', error);
      throw new InternalServerErrorException('Failed to send email.');
    }
  }
}
