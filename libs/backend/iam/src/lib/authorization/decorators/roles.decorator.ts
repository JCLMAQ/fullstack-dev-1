import { SetMetadata } from '@nestjs/common';
// import { Role } from '../../../users/enums/role.enum';
import { Role } from '@db/prisma';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
