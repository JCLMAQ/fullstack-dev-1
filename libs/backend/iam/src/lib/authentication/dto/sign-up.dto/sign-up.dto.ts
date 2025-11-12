import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class SignUpDto {
  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @ApiProperty({ description: 'Password (minimum 10 characters)', example: 'strongPassword123!' })
  @MinLength(10, { message: 'Password must be at least 10 characters long' })
  password!: string;
}
