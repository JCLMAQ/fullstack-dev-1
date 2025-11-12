import { Injectable } from '@nestjs/common';

@Injectable()
export class InvalidatedRefreshTokenError extends Error {}
