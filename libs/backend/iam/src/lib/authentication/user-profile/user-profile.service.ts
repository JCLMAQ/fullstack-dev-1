import { PrismaClientService } from '@db/prisma-client';
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AuthResponse, UserProfile, UserProfileResponse } from '../dto/account-validation.dto/account-validation.dto';

@Injectable()
export class UserProfileService {
  constructor(
    private readonly prisma: PrismaClientService,
    private readonly i18n: I18nService
  ) {}

  /**
   * Get user profile by email
   */
  async getUserByEmail(email: string, lang = 'en'): Promise<UserProfileResponse | AuthResponse> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        return {
          success: false,
          message: await this.i18n.translate('auths.EMAIL_NOT_FOUND', { lang })
        };
      }

      // Check if user is deleted
      if (user.isDeleted || user.isDeletedDT) {
        return {
          success: false,
          message: await this.i18n.translate('auths.USER_DELETED', { lang })
        };
      }

      const userProfile: UserProfile = {
        email: user.email,
        lastName: user.lastName || undefined,
        firstName: user.firstName || undefined,
        nickName: user.nickName || undefined,
        title: user.title || undefined,
        Gender: user.Gender || undefined,
        Role: user.Roles ? user.Roles.map(role => role.toString()) : undefined,
        Language: user.Language || undefined,
        photoUrl: user.photoUrl || undefined
      };

      const fullName = this.generateFullName(user.firstName, user.lastName);

      return {
        user: userProfile,
        fullName
      };
    } catch {
      return {
        success: false,
        message: await this.i18n.translate('auths.USER_NOT_FOUND', { lang })
      };
    }
  }

  /**
   * Check if user credentials exist (simplified check)
   */
  async checkUserCredentials(email: string, lang = 'en'): Promise<UserProfileResponse | AuthResponse> {
    return this.getUserByEmail(email, lang);
  }

  /**
   * Generate full name from first and last name
   */
  private generateFullName(firstName?: string | null, lastName?: string | null): string | null {
    if (!firstName && !lastName) return null;

    const parts = [];
    if (firstName) parts.push(firstName);
    if (lastName) parts.push(lastName);

    return parts.join(' ');
  }

  /**
   * Check if user is still active (not deleted or suspended)
   */
  async isUserActive(email: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) return false;

      return !user.isDeleted && !user.isDeletedDT && !user.isSuspended;
    } catch {
      return false;
    }
  }
}
