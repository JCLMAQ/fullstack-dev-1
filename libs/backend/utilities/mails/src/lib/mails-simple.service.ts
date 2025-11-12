import { AppEmailDomain } from '@db/prisma';
import { PrismaClientService } from '@db/prisma-client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailsSimpleService {
  constructor(private prisma: PrismaClientService) {}

  // Email structure verification
  async emailValidation(email: string): Promise<boolean> {
    const expression = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return expression.test(email.toLowerCase());
  }

  // Compare domain of email with allowed domains
  async isEmailDomainAccepted(domain: string): Promise<boolean> {
    try {
      const result = await this.prisma.appEmailDomain.findUnique({
        where: { domain }
      });
      return result?.allowed || false;
    } catch (error) {
      console.error('Error checking email domain:', error);
      return false;
    }
  }

  // Email domain validation process
  async validateEmailDomain(email: string): Promise<boolean> {
    if (!this.emailValidation(email)) {
      return false;
    }

    const domain = email.split('@')[1];
    return await this.isEmailDomainAccepted(domain);
  }

  // Get all allowed email domains
  async getAllowedEmailDomains(): Promise<AppEmailDomain[]> {
    return await this.prisma.appEmailDomain.findMany({
      where: { allowed: true }
    });
  }
}
