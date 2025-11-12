import { Controller, Get, Param } from '@nestjs/common';
import { MailsService } from './mails.service';

@Controller('mails')
export class MailsController {
  constructor(private mailsService: MailsService) {}


  @Get(':id')
  findOneById(@Param('id') id: string) {
    return this.mailsService.findOneUniqueEmailDomain({id: +id});
  }
  @Get(':domain')
  findOneByDomain(@Param('domain') domain: string) {
    return this.mailsService.findOneUniqueEmailDomain({domain});
  }

}
