import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomBytes } from 'crypto';
import { TokenType } from 'generated/prisma/enums';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class VerificationTokenService {
  TOKEN_TTL = 15 * 60 * 1000;
  RESEND_COOLDOWN_MS = 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async consumeToken(token: string, expectedType: TokenType) {
    const record = await this.prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record || record.type !== expectedType) return null;

    if (record.expiresAt < new Date()) {
      await this.prisma.verificationToken.delete({ where: { token } });
      return null;
    }

    await this.prisma.verificationToken.delete({ where: { token } });

    return record.user;
  }

  async sendVerificationToken(
    userId: string,
    email: string,
    type: TokenType,
  ): Promise<void> {
    const token = await this.createToken(userId, type);

    switch (type) {
      case TokenType.EMAIL_VERIFICATION:
        await this.mailService.sendVerificationEmail(email, token);
        break;
      case TokenType.PASSWORD_RESET:
        await this.mailService.sendPasswordResetEmail(email, token);
        break;
    }
  }

  async canResendToken(userId: string, type: TokenType): Promise<boolean> {
    const existing = await this.prisma.verificationToken.findFirst({
      where: { userId, type },
    });

    if (!existing) return true;

    const cooldownThreshold = new Date(Date.now() - this.RESEND_COOLDOWN_MS);

    return existing.createdAt < cooldownThreshold;
  }

  private async createToken(userId: string, type: TokenType): Promise<string> {
    await this.prisma.verificationToken.deleteMany({
      where: { userId, type },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.TOKEN_TTL);

    await this.prisma.verificationToken.create({
      data: { token, type, expiresAt, userId },
    });

    return token;
  }
}
