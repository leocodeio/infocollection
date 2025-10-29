import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Session, AllowAnonymous } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
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
  async getProfile(@Session() session: UserSession) {
    return await this.userService.getUserById(session.user.id);
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
  async getFullProfile(@Session() session: UserSession) {
    const user = await this.userService.getUserById(session.user.id);
    return {
      user,
      session: {
        id: session.session.id,
        expiresAt: session.session.expiresAt,
        userId: session.session.userId,
        ipAddress: session.session.ipAddress,
        userAgent: session.session.userAgent,
        createdAt: session.session.createdAt,
        updatedAt: session.session.updatedAt,
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
  async getUserAccounts(@Session() session: UserSession) {
    return await this.userService.getUserWithAccounts(session.user.id);
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
    @Session() session: UserSession,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.updateUser(session.user.id, updateUserDto);
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
  async deleteAccount(@Session() session: UserSession) {
    return await this.userService.deleteUser(session.user.id);
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
  async getSessions(@Session() session: UserSession) {
    return await this.userService.getUserSessions(session.user.id);
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
    @Session() session: UserSession,
    @Param('sessionId') sessionId: string,
  ) {
    return await this.userService.revokeSession(session.user.id, sessionId);
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
  async revokeAllOtherSessions(@Session() session: UserSession) {
    return await this.userService.revokeAllOtherSessions(
      session.user.id,
      session.session.id,
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
  async getStats(@Session() session: UserSession) {
    return await this.userService.getUserStats(session.user.id);
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
  async checkGoogleLink(@Session() session: UserSession) {
    const hasGoogle = await this.userService.hasGoogleAccount(session.user.id);
    return { hasGoogleAccount: hasGoogle };
  }

  // Public Endpoints

  @Get('health')
  @AllowAnonymous()
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
  @AllowAnonymous()
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
          'This API uses Better Auth for authentication with Google OAuth',
        flow: {
          step1: {
            action: 'Initiate Google Login',
            method: 'Redirect user to login URL',
            url: '/api/auth/sign-in/social?provider=google',
            description:
              'Redirect the user to this URL to start the Google OAuth flow',
          },
          step2: {
            action: 'Callback Handling',
            description:
              'After successful Google authentication, user will be redirected back to your app with a session cookie set',
            callback: '/api/auth/callback/google',
          },
          step3: {
            action: 'Session Management',
            description:
              'Session cookie is automatically set and used for authenticated requests',
            cookie: 'better-auth.session_token',
          },
        },
        endpoints: {
          login: {
            url: '/api/auth/sign-in/social',
            method: 'GET',
            params: { provider: 'google' },
            description: 'Initiate Google OAuth login',
            public: true,
          },
          getSession: {
            url: '/api/auth/get-session',
            method: 'GET',
            description: 'Get current session details',
            public: true,
            returns: 'Session object or null if not authenticated',
          },
          logout: {
            url: '/api/auth/sign-out',
            method: 'POST',
            description: 'Logout and clear session',
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
            description: 'Redirect user to Google login',
            example:
              "window.location.href = 'http://localhost:3001/api/auth/sign-in/social?provider=google'",
          },
          checkSession: {
            description: 'Check if user is authenticated',
            example:
              "const response = await fetch('http://localhost:3001/api/auth/get-session', { credentials: 'include' }); const session = await response.json();",
          },
          getProfile: {
            description: 'Get user profile',
            example:
              "const response = await fetch('http://localhost:3001/users/me', { credentials: 'include' }); const user = await response.json();",
          },
          logout: {
            description: 'Logout user',
            example:
              "await fetch('http://localhost:3001/api/auth/sign-out', { method: 'POST', credentials: 'include' });",
          },
        },
        important: {
          credentials:
            'Always include credentials: "include" in fetch requests to send session cookies',
          cors: 'Ensure your frontend origin is allowed in CORS settings',
          https: 'Use HTTPS in production for secure cookie transmission',
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
