import { TokenType } from '@db/prisma';
import { PrismaClientService } from '@db/prisma-client';
import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { I18nService } from 'nestjs-i18n';
import { HashingService } from '../../hashing/hashing.service';
import { AuthResponse } from '../dto/account-validation.dto/account-validation.dto';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaClientService,
    private readonly hashingService: HashingService,
    private readonly i18n: I18nService
  ) {}

  /**
   * Send forgot password email with reset token
   */
  async sendForgotPasswordEmail(email: string, lang = 'en'): Promise<AuthResponse> {
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

    // Check if user is active
    if (user.isDeleted || user.isDeletedDT) {
      return {
        success: false,
        message: await this.i18n.translate('auths.USER_DELETED', { lang })
      };
    }

    try {
      // Invalidate existing forgot password tokens
      await this.prisma.token.updateMany({
        where: {
          userId: user.id,
          type: TokenType.FORGOT,
          valid: true
        },
        data: { valid: false }
      });

      // Generate new reset token
      const token = this.generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2); // 2 hours expiry

      // Save token to database
      await this.prisma.token.create({
        data: {
          tokenId: token,
          type: TokenType.FORGOT,
          userId: user.id,
          expiration: expiresAt,
          valid: true
        }
      });

      // TODO: Send email with reset link
      // This should integrate with the existing mail service
      // await this.mailService.sendPasswordResetEmail(user.email, token);

      return {
        success: true,
        message: await this.i18n.translate('auths.FORGOT_PWD_EMAIL_SENT', { lang })
      };
    } catch {
      return {
        success: false,
        message: await this.i18n.translate('auths.FORGOT_PWD_EMAIL_NOT_SENT', { lang })
      };
    }
  }

  /**
   * Verify reset token validity
   */
  async verifyResetToken(token: string, lang = 'en'): Promise<{ valid: boolean; userId?: string; message: string }> {
    try {
      const tokenRecord = await this.prisma.token.findFirst({
        where: {
          tokenId: token,
          type: TokenType.FORGOT,
          valid: true,
          expiration: {
            gte: new Date()
          }
        }
      });

      if (!tokenRecord) {
        return {
          valid: false,
          message: await this.i18n.translate('auths.FORGOT_PWD_BAD_TOKEN', { lang })
        };
      }

      return {
        valid: true,
        userId: tokenRecord.userId,
        message: 'Token valid'
      };
    } catch {
      return {
        valid: false,
        message: await this.i18n.translate('auths.FORGOT_PWD_ERROR', { lang })
      };
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(
    token: string,
    newPassword: string,
    verifyPassword: string,
    lang = 'en'
  ): Promise<AuthResponse> {
    // Verify passwords match
    if (newPassword !== verifyPassword) {
      return {
        success: false,
        message: await this.i18n.translate('auths.FORGOT_PWD_BAD_PWD', { lang })
      };
    }

    // Verify token
    const tokenVerification = await this.verifyResetToken(token, lang);
    if (!tokenVerification.valid || !tokenVerification.userId) {
      return {
        success: false,
        message: tokenVerification.message
      };
    }

    try {
      // Hash new password
      const hashedPassword = await this.hashingService.hash(newPassword);

      // Update user password
      await this.prisma.userSecret.update({
        where: { userId: tokenVerification.userId },
        data: { pwdHash: hashedPassword }
      });

      // Invalidate the token
      await this.prisma.token.updateMany({
        where: {
          tokenId: token,
          type: TokenType.FORGOT,
          valid: true
        },
        data: { valid: false }
      });

      return {
        success: true,
        message: await this.i18n.translate('auths.FORGOT_PWD_NEW_PWD_OK', { lang })
      };
    } catch {
      return {
        success: false,
        message: await this.i18n.translate('auths.FORGOT_PWD_ERROR', { lang })
      };
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
    verifyPassword: string,
    lang = 'en'
  ): Promise<AuthResponse> {
    // Verify passwords match
    if (newPassword !== verifyPassword) {
      return {
        success: false,
        message: await this.i18n.translate('auths.CHANGE_PWD_ERROR', { lang })
      };
    }

    try {
      // Get user with current password
      const userSecret = await this.prisma.userSecret.findUnique({
        where: { userId }
      });

      if (!userSecret) {
        return {
          success: false,
          message: await this.i18n.translate('auths.USER_NOT_FOUND', { lang })
        };
      }

      // Verify current password
      if (!userSecret.pwdHash) {
        return {
          success: false,
          message: await this.i18n.translate('auths.CHANGE_PWD_ERROR', { lang })
        };
      }

      const isCurrentPasswordValid = await this.hashingService.compare(
        oldPassword,
        userSecret.pwdHash
      );

      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: await this.i18n.translate('auths.CHANGE_PWD_ERROR', { lang })
        };
      }

      // Hash new password
      const hashedPassword = await this.hashingService.hash(newPassword);

      // Update password
      await this.prisma.userSecret.update({
        where: { userId },
        data: { pwdHash: hashedPassword }
      });

      return {
        success: true,
        message: await this.i18n.translate('auths.CHANGE_PWD_SUCCESS', { lang })
      };
    } catch {
      return {
        success: false,
        message: await this.i18n.translate('auths.CHANGE_PWD_ERROR', { lang })
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
