import { PermissionClaim } from '@db/prisma';

export const Permission = {
    ...PermissionClaim,
  };

export type PermissionType = PermissionClaim; // | ...other permission enums
