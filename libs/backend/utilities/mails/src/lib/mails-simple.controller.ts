import { Body, Controller, Get, Post } from '@nestjs/common';
import { MailsSimpleService } from './mails-simple.service';

@Controller('mails')
export class MailsSimpleController {
  constructor(private readonly mailsService: MailsSimpleService) {}

  @Post('validate-email')
  async validateEmail(@Body('email') email: string) {
    const isValid = await this.mailsService.emailValidation(email);
    return { email, isValid };
  }

  @Post('validate-domain')
  async validateDomain(@Body('email') email: string) {
    const isDomainValid = await this.mailsService.validateEmailDomain(email);
    return { email, isDomainValid };
  }

  @Get('allowed-domains')
  async getAllowedDomains() {
    const domains = await this.mailsService.getAllowedEmailDomains();
    return { domains };
  }
}
