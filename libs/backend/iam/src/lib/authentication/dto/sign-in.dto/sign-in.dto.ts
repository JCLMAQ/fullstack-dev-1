import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumberString, IsOptional, MinLength } from 'class-validator';

export class SignInDto {
  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @ApiProperty({ description: 'Password (minimum 10 characters)', example: 'strongPassword123!' })
  @MinLength(10, { message: 'Password must be at least 10 characters long' })
  password!: string;

  @ApiProperty({ description: 'Two-factor authentication code', required: false, example: '123456' })
  @IsOptional()
  @IsNumberString({}, { message: '2FA code must be a number string' })
  tfaCode?: string;
}
