import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

/**
 * DTO for requesting account validation email
 */
export class RequestAccountValidationDto {
  @ApiProperty({
    description: 'Email address to send validation link',
    example: 'user@example.com'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;
}

/**
 * Standard response interface for auth operations
 */
export interface AuthResponse {
  success: boolean;
  message: string;
}

/**
 * User profile response interface
 */
export interface UserProfileResponse {
  user: UserProfile | null;
  fullName: string | null;
}

/**
 * User profile interface (compatible with AUTHS)
 */
export interface UserProfile {
  email: string;
  lastName?: string;
  firstName?: string;
  nickName?: string;
  title?: string;
  Gender?: string;
  Role?: string[];
  Language?: string;
  photoUrl?: string;
}