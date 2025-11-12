
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { toFileStream } from 'qrcode';
import { ActiveUser } from '../authorization/decorators/active-user.decorator';
import type { ActiveUserData } from '../interfaces/active-user-data.interface';
import { AccountValidationService } from './account-validation/account-validation.service';
import { AuthenticationService } from './authentication.service';
import { Auth } from './decorators/auth.decorator';
import {
    AuthResponse,
    RequestAccountValidationDto,
    UserProfileResponse
} from './dto/account-validation.dto/account-validation.dto';
import { ExtendedSignUpDto } from './dto/extended-sign-up.dto/extended-sign-up.dto';
import {
    ChangePasswordDto,
    ForgotPasswordDto,
    ResetPasswordDto
} from './dto/password-management.dto/password-management.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto/refresh-token.dto';
import { SignInDto } from './dto/sign-in.dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto/sign-up.dto';
import { AuthType } from './enums/auth-type.enum';
import { OtpAuthenticationService } from './otp-authentication/otp-authentication.service';
import { PasswordResetService } from './password-reset/password-reset.service';
import { UserProfileService } from './user-profile/user-profile.service';

@Auth(AuthType.None) // This allows public routes
@Controller('authentication')
export class AuthenticationController {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly otpAuthService: OtpAuthenticationService,
    private readonly i18n: I18nService,
    private readonly accountValidationService: AccountValidationService,
    private readonly passwordResetService: PasswordResetService,
    private readonly userProfileService: UserProfileService
  ) {}

  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto) {
    return await this.authService.signUp(signUpDto);
  }


  @HttpCode(HttpStatus.OK) // by default @Post does 201, we wanted 200 - hence using @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  async signIn(@Body() signInDto: SignInDto) {
    return await this.authService.signIn(signInDto);
  }

  // Cookies approach
  @HttpCode(HttpStatus.OK) // by default @Post does 201, we wanted 200 - hence using @HttpCode(HttpStatus.OK)
  @Post('sign-in-cookies')
  async signInCookie(
    @Res({ passthrough: true}) response: Response,
    @Body() signInDto: SignInDto) {
    const accessToken = await this.authService.signIn(signInDto);
    response.cookie('accessToken', accessToken, {
      secure: true,
      httpOnly: true,
      sameSite: true,
    });
  }

  // Token refresh ask
  @HttpCode(HttpStatus.OK) // changed since the default is 201
  @Post('refresh-tokens')
  refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  // 2fa QR code generate
  @Auth(AuthType.Bearer)
  @HttpCode(HttpStatus.OK)
  @Post('2fa/generate')
  async generateQrCode(
    @ActiveUser() activeUser: ActiveUserData,
    @Res() response: Response,
  ) {
    const { secret, uri } = await this.otpAuthService.generateSecret(
      activeUser.email,
    );
    await this.otpAuthService.enableTfaForUser(activeUser.email, secret);
    response.type('png');
    return toFileStream(response, uri);
  }

  // ==================== AUTHS COMPATIBILITY ROUTES ====================

  /**
   * Extended registration with profile information (AUTHS compatible)
   */
  @Post('register-extended')
  async registerExtended(@Body() registerDto: ExtendedSignUpDto, @I18nLang() lang: string): Promise<AuthResponse> {
    try {
      await this.authService.signUpExtended(registerDto);
      return {
        success: true,
        message: await this.i18n.translate("auths.REGISTRATION_DONE", { lang })
      };
    } catch {
      return {
        success: false,
        message: await this.i18n.translate("auths.REGISTRATION_FAIL", { lang })
      };
    }
  }

  /**
   * Get user profile by email (AUTHS compatible)
   */
  @Auth(AuthType.Bearer)
  @Get('user/:email')
  async getUserProfile(@Param('email') email: string, @I18nLang() lang: string): Promise<UserProfileResponse | AuthResponse> {
    return await this.userProfileService.getUserByEmail(email, lang);
  }

  /**
   * Check user credentials (AUTHS compatible)
   */
  @Auth(AuthType.Bearer)
  @Get('check-credentials/:email')
  async checkCredentials(@Param('email') email: string, @I18nLang() lang: string): Promise<UserProfileResponse | AuthResponse> {
    return await this.userProfileService.checkUserCredentials(email, lang);
  }

  /**
   * Request account validation email (AUTHS compatible)
   */
  @Post('request-account-validation')
  async requestAccountValidation(@Body() dto: RequestAccountValidationDto, @I18nLang() lang: string): Promise<AuthResponse> {
    return await this.accountValidationService.sendAccountValidationEmail(dto.email, lang);
  }

  /**
   * Validate account with token (AUTHS compatible)
   */
  @Get('validate-account/:token')
  async validateAccount(@Param('token') token: string, @I18nLang() lang: string): Promise<AuthResponse> {
    return await this.accountValidationService.validateAccount(token, lang);
  }

  /**
   * Send forgot password email (AUTHS compatible)
   */
  @Post('forgot-password')
  async sendForgotPasswordEmail(@Body() dto: ForgotPasswordDto, @I18nLang() lang: string): Promise<AuthResponse> {
    return await this.passwordResetService.sendForgotPasswordEmail(dto.email, lang);
  }

  /**
   * Verify reset password token (AUTHS compatible)
   */
  @Get('reset-password/:token')
  async verifyResetToken(@Param('token') token: string, @I18nLang() lang: string): Promise<{ valid: boolean; message: string }> {
    const result = await this.passwordResetService.verifyResetToken(token, lang);
    return {
      valid: result.valid,
      message: result.message
    };
  }

  /**
   * Reset password with token (AUTHS compatible)
   */
  @Post('reset-password/:token')
  async resetPassword(
    @Param('token') token: string,
    @Body() dto: ResetPasswordDto,
    @I18nLang() lang: string
  ): Promise<AuthResponse> {
    return await this.passwordResetService.resetPassword(token, dto.newPassword, dto.verifyPassword, lang);
  }

  /**
   * Change password for authenticated user (AUTHS compatible)
   */
  @Auth(AuthType.Bearer)
  @Post('change-password')
  async changePassword(
    @ActiveUser() activeUser: ActiveUserData,
    @Body() dto: ChangePasswordDto,
    @I18nLang() lang: string
  ): Promise<AuthResponse> {
    return await this.passwordResetService.changePassword(
      activeUser.sub,
      dto.oldPassword,
      dto.newPassword,
      dto.verifyPassword,
      lang
    );
  }
}

