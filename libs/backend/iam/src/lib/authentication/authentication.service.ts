import type { User } from '@db/prisma';
import { PrismaClientService } from '@db/prisma-client';
import {
    ConflictException,
    Inject,
    Injectable,
    UnauthorizedException
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { HashingService } from '../hashing/hashing.service';
import type { ActiveUserData } from '../interfaces/active-user-data.interface';

import jwtConfig from '../jwtconfig/jwt.config';
import { ApiKeysService } from './api-keys/api-keys.service';
import { RefreshTokenDto } from './dto/refresh-token.dto/refresh-token.dto';
import { SignInDto } from './dto/sign-in.dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto/sign-up.dto';
import { OtpAuthenticationService } from './otp-authentication/otp-authentication.service';
import { InvalidatedRefreshTokenError } from './refresh-token-ids.storage/invalid-refresh-token.error';
import { RefreshTokenIdsStorage } from './refresh-token-ids.storage/refresh-token-ids.storage';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly refreshTokenIdsStorage: RefreshTokenIdsStorage,
    private readonly apiKeysService: ApiKeysService,
    private readonly otpAuthService: OtpAuthenticationService,
    private readonly prisma: PrismaClientService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    try {
      const password = await this.hashingService.hash(signUpDto.password);
      // Create the UserApiKey
      const uuid = randomUUID();
      const payload = await this.apiKeysService.createAndHash(uuid);
      const key = payload.hashedKey;

      const data = {
        email: signUpDto.email,
        UserSecret: {
          create: {
            pwdHash: password,
          }
        },
        ApiKey: {
          create: {
            key: key,
            uuid: uuid,
          }
        } ,
      }
      await this.prisma.user.create({ data });
        const apiUserKey = payload.apiKey;
        return { apiUserKey };

    } catch (err) {
      const pgUniqueViolationErrorCode = '23505';
      if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === pgUniqueViolationErrorCode) {
        throw new ConflictException();
      }
      throw err;
    }
  }

  /**
   * Extended sign up with additional profile information (compatible with AUTHS)
   */
  async signUpExtended(signUpDto: {
    email: string;
    password: string;
    verifyPassword: string;
    lastName?: string;
    firstName?: string;
    nickName?: string;
    Gender?: string;
    Language?: string;
    Roles?: string[]
  }) {
    try {
      // Verify password confirmation
      if (signUpDto.password !== signUpDto.verifyPassword) {
        throw new ConflictException('Passwords do not match');
      }

      const password = await this.hashingService.hash(signUpDto.password);
      // Create the UserApiKey
      const uuid = randomUUID();
      const payload = await this.apiKeysService.createAndHash(uuid);
      const key = payload.hashedKey;

      const data = {
        email: signUpDto.email.toLowerCase(),
        lastName: signUpDto.lastName || null,
        firstName: signUpDto.firstName || null,
        nickName: signUpDto.nickName || null,
        UserSecret: {
          create: {
            pwdHash: password,
          }
        },
        ApiKey: {
          create: {
            key: key,
            uuid: uuid,
          }
        },
      }

      // TODO: Add Gender, Language, and Roles after fixing Prisma types

      const user = await this.prisma.user.create({ data });
      const apiUserKey = payload.apiKey;

      return {
        user: user.id,
        apiUserKey,
        success: true
      };

    } catch (err) {
      const pgUniqueViolationErrorCode = '23505';
      if (err && typeof err === 'object' && 'code' in err && err.code === pgUniqueViolationErrorCode) {
        throw new ConflictException('User already exists');
      }
      throw err;
    }
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.prisma.user.findUnique({
      where: {email: signInDto.email},
      include: {
        userSecret: true, // Return all fields
      },
    })
    if (!user) {
      throw new UnauthorizedException('User does not exists');
    }
    if (!user.userSecret?.pwdHash) {
      throw new UnauthorizedException('Password not set');
    }
    const isEqual = await this.hashingService.compare(
      signInDto.password,
      user.userSecret.pwdHash,
    );


    if (!isEqual) {
      throw new UnauthorizedException('Password does not match');
    }

    if (user.isTfaEnable) {
      if (!signInDto.tfaCode) {
        throw new UnauthorizedException('2FA code required');
      }
      if (!user.tfaSecret) {
        throw new UnauthorizedException('2FA not properly configured');
      }
      const isValid = this.otpAuthService.verifyCode(
        signInDto.tfaCode,
        user.tfaSecret,
      );
      if (!isValid) {
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }
    return await this.generateTokens(user);
  }

  async generateTokens(user: User) {
    const refreshTokenId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserData>>(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        { email: user.email , role: user.Roles},
      ),
      this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl, {
        refreshTokenId,
      }),
    ]);
    await this.refreshTokenIdsStorage.insert(user.id, refreshTokenId);
    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    try {
      const { sub, refreshTokenId } = await this.jwtService.verifyAsync<
        Pick<ActiveUserData, 'sub'> & { refreshTokenId: string }
      >(refreshTokenDto.refreshToken, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });
      const user = await this.prisma.user.findUnique({
          where: {id: sub,}
        });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      const isValid = await this.refreshTokenIdsStorage.validate(
        user.id,
        refreshTokenId,
      );
      if (isValid) {
        await this.refreshTokenIdsStorage.invalidate(user.id);
      } else {
        throw new Error('Refresh token is invalid');
      }
      return this.generateTokens(user);
    } catch (err) {
      if (err instanceof InvalidatedRefreshTokenError) {
        // Take action: notify user that his refresh token might have been stolen?
        throw new UnauthorizedException('Access denied, contact the Adminitrator');
      }
      throw new UnauthorizedException('Refresh token problem, contact the Adminitrator');
    }
  }

  private async signToken<T>(userId: string, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn,
      },
    );
  }
}
