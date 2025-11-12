import { PrismaClientService } from '@db/prisma-client';
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../../authorization/decorators/public.decorator';
import { REQUEST_USER_KEY } from '../../../iam.constants';
import { ActiveUserData } from '../../../interfaces/active-user-data.interface';

import { ApiKeysService } from '../../api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private prisma: PrismaClientService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get(IS_PUBLIC_KEY, context.getHandler());
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractKeyFromHeader(request);
    if (!apiKey) {
      throw new UnauthorizedException("no API key (or empty API key)");
    }
    const apiKeyEntityId = this.apiKeysService.extractIdFromApiKey(apiKey);
    try {
      const apiKeyEntity = await this.prisma.apiKey.findFirst({
        where: { uuid: apiKeyEntityId },
        include: { user: true },
      });

      if (!apiKeyEntity) {
        throw new UnauthorizedException("API key not found");
      }

      await this.apiKeysService.validate(apiKey, apiKeyEntity.key);
      request[REQUEST_USER_KEY] = {
        sub: apiKeyEntity.user.id,
        email: apiKeyEntity.user.email,
        role: apiKeyEntity.user.Roles,
        permissions: apiKeyEntity.user.Permissions,
      } as ActiveUserData;
    } catch {
      throw new UnauthorizedException("API key validation failed");
    }
    return true;
  }

  private extractKeyFromHeader(request: Request): string | undefined {
    const [type, key] = request.headers.authorization?.split(' ') ?? [];
    return type === 'ApiKey' ? key : undefined;
  }
}
