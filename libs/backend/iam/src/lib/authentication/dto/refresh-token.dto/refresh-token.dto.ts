import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token', example: 'eyJ0eXAiOiJKV1QiLCJhbGc...' })
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken!: string;
}
