import { Gender, Language, Role } from '@db/prisma';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength
} from "class-validator";
import { SignUpDto } from '../sign-up.dto/sign-up.dto';

/**
 * Extended SignUp DTO for compatibility with AUTHS module
 * Includes additional user profile fields from RegisterAuthDto
 */
export class ExtendedSignUpDto extends SignUpDto {
  @ApiProperty({
    description: 'Password confirmation',
    example: 'strongPassword123!'
  })
  @IsString()
  @MinLength(10, { message: 'Verify password must be at least 10 characters long' })
  verifyPassword!: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
    minLength: 2,
    maxLength: 50
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  @Matches(/^[a-zA-ZÀ-ÿ\s-']+$/, { message: 'Last name can only contain letters, spaces, hyphens and apostrophes' })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John',
    minLength: 2,
    maxLength: 50
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  @Matches(/^[a-zA-ZÀ-ÿ\s-']+$/, { message: 'First name can only contain letters, spaces, hyphens and apostrophes' })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User nickname',
    example: 'johndoe',
    minLength: 3,
    maxLength: 20
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Nickname must be at least 3 characters long' })
  @MaxLength(20, { message: 'Nickname must not exceed 20 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Nickname can only contain letters, numbers, underscores and hyphens' })
  nickName?: string;

  @ApiPropertyOptional({
    description: 'User gender',
    enum: Gender,
    example: Gender.MALE
  })
  @IsOptional()
  @IsEnum(Gender, { message: 'Gender must be a valid value' })
  Gender?: Gender;

  @ApiPropertyOptional({
    description: 'User preferred language',
    enum: Language,
    example: Language.en
  })
  @IsOptional()
  @IsEnum(Language, { message: 'Language must be a valid value' })
  Language?: Language;

  @ApiPropertyOptional({
    description: 'User roles',
    type: [String],
    enum: Role,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true, message: 'Each role must be a valid value' })
  Roles?: Role[];
}
