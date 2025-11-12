/*
Based on:
https://medium.com/@boladebode/exploring-the-new-release-of-nest-js-version-10-and-the-migration-from-nest-modules-mailer-b80c574f89e6
*/


import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import * as path from 'path';

@Injectable()
export class MailingService {
  private transporter: nodemailer.Transporter;
  private confirmationTemplate: handlebars.TemplateDelegate;
  private passwordResetTemplate: handlebars.TemplateDelegate;
  private groupInviteTemplate: handlebars.TemplateDelegate;

  constructor() {
    this.transporter = nodemailer.createTransport(
      {
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: process.env.EMAILER_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_NOREPLY_USER,
          pass: process.env.EMAIL_NOREPLY_PWD,
        },
      },
      {
        from: {
          name: 'No-reply',
          address: process.env.EMAIL_NOREPLY,
        },
      },
    );

    // Load Handlebars templates
    this.confirmationTemplate = this.loadTemplate('confirmation.hbs');
  }

  private loadTemplate(templateName: string): handlebars.TemplateDelegate {
    const templatesFolderPath = path.join(__dirname, './templates');
    const templatePath = path.join(templatesFolderPath, templateName);

    const templateSource = fs.readFileSync(templatePath, 'utf8');
    return handlebars.compile(templateSource);
  }

  async sendUserConfirmation(user: any, token: string) {
    const url = `${process.env.CLIENT_URL}?token=${token}`;
    const html = this.confirmationTemplate({ name: user.firstName, url });

    await this.transporter.sendMail({
      to: user.email,
      subject: 'Welcome user! Confirm your Email',
      html: html,
    });
  }

  // Other email sending methods...
}
