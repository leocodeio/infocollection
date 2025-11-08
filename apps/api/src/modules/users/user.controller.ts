import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import type { RequestUser } from '../auth/types/auth.types';
import { UserService } from './user.service';
import {
  UserResponseDto,
  UserAccountsResponseDto,
  SessionResponseDto,
  UserWithSessionDto,
} from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Profile Management

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the authenticated user profile information',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: RequestUser) {
    return await this.userService.getUserById(user.userId);
  }

  @Get('me/full')
  @ApiOperation({
    summary: 'Get current user with session details',
    description:
      'Returns the authenticated user profile with current session information',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile with session retrieved successfully',
    type: UserWithSessionDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFullProfile(@CurrentUser() user: RequestUser) {
    const userProfile = await this.userService.getUserById(user.userId);
    const sessions = await this.userService.getUserSessions(user.userId);
    const currentSession = sessions.find((s) => s.id === user.sessionId);

    return {
      user: userProfile,
      session: currentSession || {
        id: user.sessionId,
        expiresAt: new Date(),
        userId: user.userId,
      },
    };
  }

  @Get('me/accounts')
  @ApiOperation({
    summary: 'Get user with linked accounts',
    description:
      'Returns the user profile with all linked OAuth provider accounts (Google, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'User with accounts retrieved successfully',
    type: UserAccountsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserAccounts(@CurrentUser() user: RequestUser) {
    return await this.userService.getUserWithAccounts(user.userId);
  }

  @Put('me')
  @ApiOperation({
    summary: 'Update current user profile',
    description:
      'Update user profile information (name, phone, role, profile completion status, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request or email already in use',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.updateUser(user.userId, updateUserDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete current user account',
    description:
      'Permanently delete the user account and all associated data. This action cannot be undone.',
  })
  @ApiResponse({
    status: 200,
    description: 'Account deleted successfully',
    schema: {
      properties: {
        message: { type: 'string', example: 'Account deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAccount(@CurrentUser() user: RequestUser) {
    return await this.userService.deleteUser(user.userId);
  }

  // Session Management

  @Get('me/sessions')
  @ApiOperation({
    summary: 'Get all active sessions',
    description:
      'Returns all active sessions for the current user across all devices',
  })
  @ApiResponse({
    status: 200,
    description: 'Active sessions retrieved successfully',
    type: [SessionResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSessions(@CurrentUser() user: RequestUser) {
    return await this.userService.getUserSessions(user.userId);
  }

  @Delete('me/sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke a specific session',
    description:
      'Revoke/logout a specific session by ID. Useful for logging out from other devices.',
  })
  @ApiResponse({
    status: 200,
    description: 'Session revoked successfully',
    schema: {
      properties: {
        message: { type: 'string', example: 'Session revoked successfully' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Cannot revoke session of another user',
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async revokeSession(
    @CurrentUser() user: RequestUser,
    @Param('sessionId') sessionId: string,
  ) {
    return await this.userService.revokeSession(user.userId, sessionId);
  }

  @Delete('me/sessions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke all other sessions',
    description:
      'Revoke all sessions except the current one. Useful for logging out from all other devices.',
  })
  @ApiResponse({
    status: 200,
    description: 'All other sessions revoked successfully',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'All other sessions revoked successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async revokeAllOtherSessions(@CurrentUser() user: RequestUser) {
    return await this.userService.revokeAllOtherSessions(
      user.userId,
      user.sessionId,
    );
  }

  // User Statistics

  @Get('me/stats')
  @ApiOperation({
    summary: 'Get user statistics',
    description: 'Returns statistics about the user (active sessions, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
    schema: {
      properties: {
        activeSessions: { type: 'number', example: 3 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(@CurrentUser() user: RequestUser) {
    return await this.userService.getUserStats(user.userId);
  }

  // Account Status

  @Get('me/google-linked')
  @ApiOperation({
    summary: 'Check if Google account is linked',
    description: 'Returns whether the user has a Google account linked',
  })
  @ApiResponse({
    status: 200,
    description: 'Google account link status retrieved',
    schema: {
      properties: {
        hasGoogleAccount: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkGoogleLink(@CurrentUser() user: RequestUser) {
    const hasGoogle = await this.userService.hasGoogleAccount(user.userId);
    return { hasGoogleAccount: hasGoogle };
  }

  // Public Endpoints (no authentication required)

  @Get('health')
  @UseGuards() // Override class-level guard
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Public endpoint to check if the user service is running',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2025-01-01T00:00:00.000Z' },
      },
    },
  })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('docs')
  @UseGuards() // Override class-level guard
  @ApiOperation({
    summary: 'Get API documentation for UI integration',
    description:
      'Returns basic authentication and API documentation for frontend integration',
  })
  @ApiResponse({
    status: 200,
    description: 'Documentation retrieved successfully',
  })
  getDocs() {
    return {
      authentication: {
        description:
          'This API uses custom JWT authentication with Google OAuth',
        flow: {
          step1: {
            action: 'Register or Login',
            methods: ['POST /auth/register', 'POST /auth/login'],
            description:
              'Create account with email/password or login to get access token',
          },
          step2: {
            action: 'Google OAuth (Alternative)',
            method: 'Redirect user to /auth/google',
            url: '/auth/google',
            description:
              'Redirect the user to this URL to start the Google OAuth flow',
          },
          step3: {
            action: 'Use Access Token',
            description:
              'Include access token in Authorization header or cookie for authenticated requests',
            header: 'Authorization: Bearer <access_token>',
          },
        },
        endpoints: {
          register: {
            url: '/auth/register',
            method: 'POST',
            body: { email: 'string', password: 'string', name: 'string' },
            description: 'Create a new account',
            public: true,
          },
          login: {
            url: '/auth/login',
            method: 'POST',
            body: { email: 'string', password: 'string' },
            description: 'Login with email and password',
            public: true,
            returns: 'Access token and refresh token',
          },
          googleLogin: {
            url: '/auth/google',
            method: 'GET',
            description: 'Initiate Google OAuth login',
            public: true,
          },
          refresh: {
            url: '/auth/refresh',
            method: 'POST',
            body: { refreshToken: 'string' },
            description: 'Refresh access token',
            public: true,
          },
          logout: {
            url: '/auth/logout',
            method: 'POST',
            description: 'Logout and clear session',
            authenticated: true,
          },
          me: {
            url: '/auth/me',
            method: 'GET',
            description: 'Get current authenticated user',
            authenticated: true,
          },
        },
      },
      userEndpoints: {
        profile: {
          getProfile: {
            url: '/users/me',
            method: 'GET',
            description: 'Get current user profile',
            authenticated: true,
            returns: 'User object with profile information',
          },
          getFullProfile: {
            url: '/users/me/full',
            method: 'GET',
            description: 'Get user profile with session details',
            authenticated: true,
            returns: 'User object with current session information',
          },
          updateProfile: {
            url: '/users/me',
            method: 'PUT',
            description: 'Update user profile',
            authenticated: true,
            body: {
              name: 'string (optional)',
              phone: 'string (optional)',
              phoneVerified: 'boolean (optional)',
              role: 'string (optional)',
              profileCompleted: 'boolean (optional)',
            },
          },
          deleteAccount: {
            url: '/users/me',
            method: 'DELETE',
            description: 'Permanently delete user account',
            authenticated: true,
            warning: 'This action cannot be undone',
          },
        },
        sessions: {
          getAllSessions: {
            url: '/users/me/sessions',
            method: 'GET',
            description: 'Get all active sessions across devices',
            authenticated: true,
          },
          revokeSession: {
            url: '/users/me/sessions/:sessionId',
            method: 'DELETE',
            description: 'Logout from a specific device',
            authenticated: true,
          },
          revokeAllOther: {
            url: '/users/me/sessions',
            method: 'DELETE',
            description: 'Logout from all other devices except current',
            authenticated: true,
          },
        },
        accounts: {
          getAccounts: {
            url: '/users/me/accounts',
            method: 'GET',
            description: 'Get linked OAuth accounts',
            authenticated: true,
          },
          checkGoogleLink: {
            url: '/users/me/google-linked',
            method: 'GET',
            description: 'Check if Google account is linked',
            authenticated: true,
          },
        },
        stats: {
          getStats: {
            url: '/users/me/stats',
            method: 'GET',
            description: 'Get user statistics (active sessions count)',
            authenticated: true,
          },
        },
      },
      integration: {
        frontend: {
          login: {
            description: 'Login with email/password',
            example:
              "const response = await fetch('http://localhost:3001/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), credentials: 'include' });",
          },
          googleLogin: {
            description: 'Redirect user to Google login',
            example:
              "window.location.href = 'http://localhost:3001/auth/google'",
          },
          getProfile: {
            description: 'Get user profile with bearer token',
            example:
              "const response = await fetch('http://localhost:3001/users/me', { headers: { 'Authorization': `Bearer ${accessToken}` } });",
          },
          logout: {
            description: 'Logout user',
            example:
              "await fetch('http://localhost:3001/auth/logout', { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}` } });",
          },
        },
        important: {
          credentials:
            'Include credentials: "include" in fetch requests for cookie-based auth',
          cors: 'Ensure your frontend origin is allowed in CORS settings',
          https: 'Use HTTPS in production for secure cookie transmission',
          bearer:
            'Use Authorization: Bearer <token> header for token-based auth',
        },
      },
      apiInfo: {
        baseUrl: 'http://localhost:3001',
        version: '1.0.0',
        documentation: '/api-docs',
        healthCheck: '/users/health',
      },
    };
  }
}
