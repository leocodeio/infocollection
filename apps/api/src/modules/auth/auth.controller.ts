import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Res,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './services/auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto';
import { JwtAuthGuard, GoogleAuthGuard } from './guards';
import { CurrentUser } from './decorators';
import type { User } from '@prisma/client';
import { cookieConstants } from './constants/auth.constants';
import type { GoogleProfile } from './types/auth.types';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user with email and password' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description:
      'User successfully registered. Returns user data and session info. Sets access and refresh token cookies.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or user already exists',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.registerWithEmail(
      registerDto.email,
      registerDto.password,
      registerDto.name,
    );

    // Set cookies
    this.setCookies(response, result.accessToken, result.refreshToken);

    return {
      user: result.user,
      session: result.session,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description:
      'User successfully logged in. Returns user data and session info. Sets access and refresh token cookies.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.loginWithEmail(
      loginDto.email,
      loginDto.password,
    );

    // Set cookies
    this.setCookies(response, result.accessToken, result.refreshToken);

    return {
      user: result.user,
      session: result.session,
    };
  }

  @Get('google')
  @ApiOperation({ summary: 'Get Google OAuth authentication URL' })
  @ApiResponse({
    status: 200,
    description: 'Returns Google OAuth URL for authentication',
    schema: {
      properties: {
        authUrl: {
          type: 'string',
          example: 'https://accounts.google.com/o/oauth2/v2/auth?...',
        },
        message: {
          type: 'string',
          example: 'Use this URL to authenticate with Google',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Google OAuth not properly configured',
  })
  async googleAuth() {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const apiBaseUrl = this.configService.get<string>('API_BASE_URL');

    if (!googleClientId || !apiBaseUrl) {
      throw new Error('Google OAuth is not properly configured');
    }

    const redirectUri = `${apiBaseUrl}/auth/callback/google`;
    const scope = 'email profile';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;

    return {
      authUrl,
      message: 'Use this URL to authenticate with Google',
    };
  }

  @Get('callback/google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary:
      'Google OAuth callback endpoint (used by Google, not called directly)',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend with authentication cookies set',
  })
  async googleAuthCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const googleProfile = req.user as GoogleProfile;
    const result = await this.authService.loginWithGoogle(googleProfile);

    // Set cookies
    this.setCookies(response, result.accessToken, result.refreshToken);

    // Redirect to frontend with session
    const frontendUrl =
      this.configService.get<string>('APP_BASE_URL') || 'http://localhost:5173';
    return response.redirect(`${frontendUrl}/auth/callback`);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description:
      'Access token refreshed successfully. Returns new tokens and user data.',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.refreshTokens(
      refreshTokenDto.refreshToken,
    );

    // Set cookies
    this.setCookies(response, result.accessToken, result.refreshToken);

    return {
      user: result.user,
      session: result.session,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user and invalidate session' })
  @ApiResponse({
    status: 200,
    description:
      'User logged out successfully. Cookies cleared and session invalidated.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Extract session ID from JWT payload
    const sessionId = (req.user as any).sessionId;
    if (sessionId) {
      await this.authService.logout(sessionId);
    }

    // Clear cookies
    this.clearCookies(response);

    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user information' })
  @ApiResponse({
    status: 200,
    description: 'Returns current user data',
    schema: {
      properties: {
        id: { type: 'string', example: 'clxxx...' },
        email: { type: 'string', example: 'user@example.com' },
        name: { type: 'string', example: 'John Doe' },
        image: { type: 'string', nullable: true },
        emailVerified: { type: 'boolean', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  async getMe(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      emailVerified: user.emailVerified,
    };
  }



  private setCookies(
    response: Response,
    accessToken: string,
    refreshToken?: string,
  ) {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    // Set access token cookie
    response.cookie(cookieConstants.accessTokenName, accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Set refresh token cookie if provided
    if (refreshToken) {
      response.cookie(cookieConstants.refreshTokenName, refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    }
  }

  private clearCookies(response: Response) {
    response.clearCookie(cookieConstants.accessTokenName);
    response.clearCookie(cookieConstants.refreshTokenName);
    response.clearCookie(cookieConstants.sessionName);
  }
}
