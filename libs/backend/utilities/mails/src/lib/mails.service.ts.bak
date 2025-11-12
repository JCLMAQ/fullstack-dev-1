import { DbConfigService } from '@be/db-config';
// import { MailerService } from '@nestjs-modules/mailer';
import { AppEmailDomain, Prisma } from '@db/prisma';
import { PrismaClientService } from '@db/prisma-client';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import * as nodemailer from 'nodemailer';
import SMTPTransport = require('nodemailer/lib/smtp-transport');

  type emailData = {
    fromEmail: string;
    toEmail: string;
    subjectEmail: string;
    textEmail: string;
    htmlEmail: string
  }
  @Injectable()
  export class MailsService {
    constructor(
      private prisma: PrismaClientService,
      private configService: ConfigService,
      // private mailerService: MailerService,
      private dbConfigService: DbConfigService,
      private i18n: I18nService,
      ) {}

  /*
  *** Sending Email
  */

  async sendEmailToken(emailData: emailData): Promise<boolean> {
    // Step 1: buildup the transporter - connexion to the SMTP
        // Connexion - transporter data: EMAIL_HOST, EMAIL_PORT, EMAIL_NOREPLY, EMAIL_NOREPLY_PWD
        const transporter = nodemailer.createTransport({
                host: await this.dbConfigService.searchConfigParam("EMAIL_HOST"),
                port: await this.dbConfigService.searchConfigParam("EMAIL_PORT"),
                auth: {
                    user: await this.dbConfigService.searchConfigParam("EMAIL_NOREPLY_USER"),
                    pass: await this.dbConfigService.searchConfigParam("EMAIL_NOREPLY_PWD"),
                }
            } as unknown as SMTPTransport.Options);
    // Step 2: buildup the email
        const {fromEmail, toEmail, subjectEmail, textEmail, htmlEmail } = emailData
        // Email to send with defined transport object
        const mailDetails = await transporter.sendMail({
           from: fromEmail, // Sender address // '"No reply" <project.1@localhost>'
           to: toEmail, // List of receivers
           subject: subjectEmail, // Subject line
           text: textEmail, // plain text body // `NestJS your token: ${token}.`
           html: htmlEmail // HTML body // html: `Hello <br> Please, use this token to confirm your login : ${token} <br>
        });
    // Step 3: Sending email
        const sendMail = await new Promise<boolean>(function (resolve, reject) {
            return transporter.sendMail(mailDetails, function (err, info: nodemailer.SentMessageInfo) {
                if (err) return reject(false);
                return resolve(info);
            });
        });
        return sendMail;
  }

  /*
  *** End Sending Email
  */

  /*
  ***    Email management utilities
  */
  // Compare password and verify passwor
  async verifyPwd( password: string | undefined , verifyPassword: string | undefined): Promise<boolean> {
    const answer = password === verifyPassword;
    return answer;
  }

  // Compare AppURL with domain of email
  async domainEmailVerification(email: string): Promise<boolean> {
    // Verify that the domain of the email is the accepted one (if this option is activeted)
    const compareAppUrl = await this.compareDomainOfEmailWithAllowed(email);
    // If yes verify the API of the email
    // If they do not correspond : reject the login or the registration
    return compareAppUrl;
  }

  // Email structure vérification
  async emailValidation(email: string ): Promise<boolean> {
    const expression = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z-0-9]+\.)+[a-zA-Z]{2,}))$/;
    // Process with REGEX
    const okEmail: boolean = expression.test(email.toLowerCase());
    return okEmail;
  }

  /*
  *** Verify if the domain of the email is among one authorised within the DB
  */

    async compareDomainOfEmail(emailDomain: string, email: string){
      // Compare with received data (emailDomain and email)
      const res = email.split("@");
      const domain = res[1];
      if(emailDomain == domain){
          return true
      }
      return false
  }

    async compareDomainOfEmailWithAllowed(email: string): Promise<boolean> {
        // Compare with data fo the DB
        const res = email.split("@");
        const domain = res[1];
        return await this.isEmailDomainAccepted(domain);
    }

  // End Verify if the domain of the email is among one authorised within the DB

  // Email Allowed Domain Validation

    async findOneUniqueEmailDomain(emaildomainWhereUniqueInput: Prisma.AppEmailDomainWhereUniqueInput): Promise<AppEmailDomain | null> {
      // Find the domain name within the DB if Exist
      const domains: AppEmailDomain | null  = await this.prisma.appEmailDomain.findUnique({ where: emaildomainWhereUniqueInput, })
      return domains
    }

    async isEmailDomainAccepted(domain: string): Promise<boolean> {
      // Verify the domain for the email is an accepted one
      let isAccepted = false;
      const result: AppEmailDomain | null = await this.findOneUniqueEmailDomain({ domain })
      if(result === null) {
        // Look within the .env file
        isAccepted = (this.configService.get<string>("APP_EMAIL_ALLOWED_DOMAIN") === domain);
        return isAccepted;
      }
      isAccepted = result?.allowed || false;
      return isAccepted;
    }
  /*
  *** Email Allowed Domain Validation - End
  */

  async emailValidationProcess(email: string , lang: string): Promise<boolean> {
    // Email validation against the strucure of the email and the domain (if doamin restriction active)
     // Verify the username email looks well as an email
    const goodEmail = await this.emailValidation(email);
    if (!goodEmail) {
      throw new HttpException(await this.i18n.translate("auths.EMAIL_NOT_VALID",{ lang: lang, }), 400);
    }
     // Verify the domain is accepted if the fonctionality is activeted
    const apiEmailActiveted = (await this.dbConfigService.searchConfigParam( "APP_EMAIL_LIMIT_DOMAIN" ) === "1");
    if(apiEmailActiveted ){
      const compareAppUrl = await this.compareDomainOfEmailWithAllowed(email);
      if(!compareAppUrl) {
        throw new HttpException(await this.i18n.translate("auths.EMAIL_BAD",{ lang: lang, }), 400);
      }
    }
    return true
  }

  /*
  *** Not Used
  */
    // Example of sending a confirmation email
    // async sendUserConfirmation(user: User, token: string) {
    //   const url = `example.com/auth/confirm?token=${token}`;

    //   await this.mailerService.sendMail({
    //     to: user.email,
    //     // from: '"Support Team" <support@example.com>', // override default from
    //     subject: 'Welcome to Nice App! Confirm your Email',
    //     template: './confirmation', // `.hbs` extension is appended automatically
    //     context: { // ✏️ filling curly brackets with content
    //       name: user.lastName + " " + user.firstName,
    //       url,
    //     },
    //   });
    // }
}

