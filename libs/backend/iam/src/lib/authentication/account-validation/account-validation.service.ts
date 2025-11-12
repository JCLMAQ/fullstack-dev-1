import { TokenType } from '@db/prisma';
import { PrismaClientService } from '@db/prisma-client';
import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { I18nService } from 'nestjs-i18n';
import { AuthResponse } from '../dto/account-validation.dto/account-validation.dto';

@Injectable()
export class AccountValidationService {
  constructor(
    private readonly prisma: PrismaClientService,
    private readonly i18n: I18nService
  ) {}

  /**
   * Send account validation email with token
   */
  async sendAccountValidationEmail(email: string, lang = 'en'): Promise<AuthResponse> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return {
        success: false,
        message: await this.i18n.translate('auths.EMAIL_NOT_FOUND', { lang })
      };
    }

    // Check if account is already validated
    if (user.isValidated) {
      return {
        success: false,
        message: await this.i18n.translate('auths.ACCOUNT_VALIDATION_ALREADY_DONE', { lang })
      };
    }

    try {
      // Generate validation token
      const token = this.generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

      // Save token to database
      await this.prisma.token.create({
        data: {
          tokenId: token,
          type: TokenType.ACCOUNT,
          userId: user.id,
          expiration: expiresAt,
          valid: true
        }
      });

      // TODO: Send email with validation link
      // This should integrate with the existing mail service
      // await this.mailService.sendAccountValidationEmail(user.email, token);

      return {
        success: true,
        message: await this.i18n.translate('auths.ACCOUNT_VALIDATION_EMAIL_SENT', { lang })
      };
    } catch {
      return {
        success: false,
        message: await this.i18n.translate('auths.ACCOUNT_VALIDATION_EMAIL_NOT_SENT', { lang })
      };
    }
  }

  /**
   * Validate account using token
   */
  async validateAccount(token: string, lang = 'en'): Promise<AuthResponse> {
    try {
      // Find and verify token
      const tokenRecord = await this.prisma.token.findFirst({
        where: {
          tokenId: token,
          type: TokenType.ACCOUNT,
          valid: true,
          expiration: {
            gte: new Date()
          }
        },
        include: {
          user: true
        }
      });

      if (!tokenRecord) {
        return {
          success: false,
          message: await this.i18n.translate('auths.ACCOUNT_VALIDATION_INVALID_TOKEN', { lang })
        };
      }

      // Update user validation status
      await this.prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { isValidated: new Date() }
      });

      // Mark token as used
      await this.prisma.token.update({
        where: { id: tokenRecord.id },
        data: { valid: false }
      });

      return {
        success: true,
        message: await this.i18n.translate('auths.ACCOUNT_VALIDATION_SUCCESS', { lang })
      };
    } catch {
      return {
        success: false,
        message: await this.i18n.translate('auths.ACCOUNT_VALIDATION_FAIL', { lang })
      };
    }
  }

  /**
   * Generate secure random token
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }
}
