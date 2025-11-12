import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * DTO for requesting password reset email
 */
export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address to send reset link',
    example: 'user@example.com'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;
}

/**
 * DTO for resetting password with token
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'New password',
    example: 'newStrongPassword123!',
    minLength: 10
  })
  @IsString()
  @MinLength(10, { message: 'Password must be at least 10 characters long' })
  newPassword!: string;

  @ApiProperty({
    description: 'Password confirmation',
    example: 'newStrongPassword123!'
  })
  @IsString()
  @MinLength(10, { message: 'Verify password must be at least 10 characters long' })
  verifyPassword!: string;
}

/**
 * DTO for changing password (authenticated user)
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'currentPassword123!'
  })
  @IsString()
  @MinLength(10, { message: 'Current password is required' })
  oldPassword!: string;

  @ApiProperty({
    description: 'New password',
    example: 'newStrongPassword123!',
    minLength: 10
  })
  @IsString()
  @MinLength(10, { message: 'New password must be at least 10 characters long' })
  newPassword!: string;

  @ApiProperty({
    description: 'Password confirmation',
    example: 'newStrongPassword123!'
  })
  @IsString()
  @MinLength(10, { message: 'Verify password must be at least 10 characters long' })
  verifyPassword!: string;
}