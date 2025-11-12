export * from './lib/prisma-client.module';
export * from './lib/prisma-client.service';

// Export Prisma types and namespace
export {
  Prisma
} from '@db/prisma';

export type {
  RefreshToken, User, UserCreateInput, UserUpdateInput, UserWhereUniqueInput
} from '@db/prisma';

