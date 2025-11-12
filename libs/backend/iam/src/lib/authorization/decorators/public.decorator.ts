import { SetMetadata } from '@nestjs/common';

// @Public() // Public guards

export const IS_PUBLIC_KEY = 'isPublic';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
