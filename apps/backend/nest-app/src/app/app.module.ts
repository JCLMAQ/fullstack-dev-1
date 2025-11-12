import { AddressModule } from '@be/address';
import { AppEmailDomainsModule } from '@be/appEmailDomains';
// import { AuthModule } from '@be/auth';
import { CategoriesModule } from '@be/categories';
import { CommentsModule } from '@be/comments';
import { ConfigParamsModule } from '@be/configParams';
import { DbConfigModule } from '@be/db-config';
import { FilesModule } from '@be/files';
import { FilesUtilitiesModule } from '@be/files-utilities';
import { GroupsModule } from '@be/groups';
import { IamModule } from '@be/iam';
import { ImagesModule } from '@be/images';
import { MailsSimpleModule } from '@be/mails';
import { OrganizationsModule } from '@be/organizations';
import { OrgDomainsModule } from '@be/orgDomains';
import { OrgEmailsModule } from '@be/orgEmails';
import { OrgEmailUseTosModule } from '@be/orgEmailUseTos';
import { PhonesModule } from '@be/phones';
import { PostLikesModule } from '@be/postLikes';
import { PostsModule } from '@be/posts';
import { ProfilesModule } from '@be/profiles';
import { StoriesModule } from '@be/stories';
import { TasksModule } from '@be/tasks';
import { TimeUtilModule } from '@be/time-util';
import { TodosModule } from '@be/todos';
import { UserFollowersModule } from '@be/userFollowers';
import { UsersModule } from '@be/users';
import { PrismaClientModule } from '@db/prisma-client';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import * as Joi from 'joi';
import { ClsModule } from 'nestjs-cls';
import { AcceptLanguageResolver, HeaderResolver, I18nJsonLoader, I18nModule, QueryResolver } from 'nestjs-i18n';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import path = require('path');

@Module({
  imports: [

    ClsModule.forRoot({
      // Register the ClsModule and automatically mount the ClsMiddleware
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req) => {
          const userId = req.headers['x-user-id'];
          const userRole = req.headers['x-user-role'] ?? 'USER';
          cls.set(
            'user',
            userId ? { id: Number(userId), role: userRole } : undefined,
          );
        },
      },
    }),

    ConfigModule.forRoot({
      // envFilePath: '../.development.env', // Look for .env file in the main directory and not in the backend directory
      envFilePath: '.env', // Look for .env file in the main directory
      isGlobal: true, // No need to import ConfigModule in each module
      expandVariables: true, // Allow expanded variable = ${VARIABLE_NAME}
      cache: true, // To accelarate the env variables loading
      validationSchema: Joi.object({
        // NODE_ENV: Joi.string()
        //   .valid('development', 'production', 'test', 'provision')
        //   .default('development'),
        // NEST_SERVER_PORT: Joi.number().default(3100),
        JWT_VALIDITY_DURATION: Joi.string().default('240s'),
        }),
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      fallbacks: {
        'en-CA': 'fr',
        'en-*': 'en',
        'fr-*': 'fr',
        pt: 'pt-BR',
      },
      loader: I18nJsonLoader,
      loaderOptions: {
      path: path.join(__dirname, 'assets/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang', 'locale', 'l'] },
        new HeaderResolver(['x-custom-lang']),
        AcceptLanguageResolver,
      ],
    }),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        dest: configService.get<string>('FILES_STORAGE_DEST') || './upload',
        limits: {fileSize: configService.get<number>('FILES_MAX_SIZE') || 2000000}
      }),
      inject: [ConfigService],
    }),

    ConfigModule,
    MailsSimpleModule,
    PostsModule,
    UsersModule,
    CommentsModule,
    ImagesModule,
    AddressModule,
    UserFollowersModule,
    TimeUtilModule,
    IamModule,
    PrismaClientModule,
    AppEmailDomainsModule,
    CategoriesModule,
    ConfigParamsModule,
    DbConfigModule,
    FilesModule,
    FilesUtilitiesModule,
    GroupsModule,
    OrganizationsModule,
    OrgDomainsModule,
    OrgEmailsModule,
    OrgEmailUseTosModule,
    PhonesModule,
    PostLikesModule,
    ProfilesModule,
    StoriesModule,
    TasksModule,
    TodosModule,
    UserFollowersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
