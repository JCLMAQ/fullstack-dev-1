import { PrismaClientModule } from '@db/prisma-client';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AccountValidationService } from './authentication/account-validation/account-validation.service';
import { ApiKeysRepository } from './authentication/api-keys/api-key.repository';
import { ApiKeysService } from './authentication/api-keys/api-keys.service';
import { AuthenticationController } from './authentication/authentication.controller';
import { AuthenticationService } from './authentication/authentication.service';
import { AccessTokenGuard } from './authentication/guards/access-token/access-token.guard';
import { ApiKeyGuard } from './authentication/guards/api-key/api-key.guard';
import { AuthenticationGuard } from './authentication/guards/authentication/authentication.guard';
import { OtpAuthenticationService } from './authentication/otp-authentication/otp-authentication.service';
import { PasswordResetService } from './authentication/password-reset/password-reset.service';
import { InvalidatedRefreshTokenError } from './authentication/refresh-token-ids.storage/invalid-refresh-token.error';
import { RefreshTokenIdsStorage } from './authentication/refresh-token-ids.storage/refresh-token-ids.storage';
import { RefreshTokenIdsStorageService } from './authentication/refresh-token-ids.storage/refresh-token-ids.storage.service';
import { UserProfileService } from './authentication/user-profile/user-profile.service';
import { PermissionsGuard } from './authorization/guards/permissions/permissions.guard';
import { PoliciesGuard } from './authorization/guards/polycies/policies.guard';
import { RolesGuard } from './authorization/guards/roles/roles.guard';
import { PolicyHandlerStorage } from './authorization/policies/policy-handlers.storage';
import { BcryptService, HashingService } from './hashing/index';
import jwtConfig from './jwtconfig/jwt.config';

@Global()
@Module({
  imports: [
    PrismaClientModule,
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig)
  ],
  controllers: [
    AuthenticationController
  ],
  providers: [
    {
      provide: HashingService,
      useClass: BcryptService, // 👈
    },

  // All routes need authentication unles mark with @Public
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },

    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PoliciesGuard,
    },
    AccessTokenGuard,
    ApiKeyGuard,
    AuthenticationService,
    ApiKeysService,
    ApiKeysRepository,
    PolicyHandlerStorage,
    RefreshTokenIdsStorageService,
    RefreshTokenIdsStorage,
    InvalidatedRefreshTokenError,
    OtpAuthenticationService,
    AccountValidationService,
    PasswordResetService,
    UserProfileService
  ],
  exports: [],
})
export class IamModule {}
