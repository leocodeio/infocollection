# Better Auth to In-House Authentication Migration Guide

## System Prompt for AI Agents

When implementing this migration, follow these guidelines:

1. **Code Structure Pattern**: Follow the existing module structure in `src/modules/query` as reference
   - Each module should have: `module.ts`, `controller.ts`, `service.ts`, `dto/` folder
   - Use NestJS decorators and dependency injection patterns
   - Follow the existing Swagger/OpenAPI documentation patterns

2. **Use Context7 for Documentation**:
   - Use Context7 to fetch NestJS documentation: `/nestjs/docs.nestjs.com`
   - Use Context7 for JWT implementation: `/nestjs/jwt`
   - Reference Passport strategies if needed: `/jaredhanson/passport-google-oauth2`
   - Query topics: "authentication", "guards", "jwt", "passport", "oauth"

3. **Prisma Schema**:
   - DO NOT modify `prisma/schema.prisma` - use it as reference only
   - All existing models (User, Session, Account, Verification) must remain unchanged
   - Reference these models in your implementation

4. **Dependencies**:
   - Install minimal dependencies only when needed
   - Prefer native NestJS packages (@nestjs/jwt, @nestjs/passport)
   - Remove Better Auth dependencies only after complete migration

5. **Testing Strategy**:
   - Test each endpoint after implementation
   - Ensure all existing functionality is preserved
   - Validate JWT token generation and verification

---

## Migration Overview

**Objective**: Replace Better Auth with a complete in-house authentication implementation while maintaining all existing functionality.

**Current Better Auth Features to Preserve**:

- Email/Password authentication
- Google OAuth authentication
- Session management
- User profile management
- Bearer token authentication
- Protected routes
- Cookie-based sessions
- CORS and security configurations

---

## Phase 1: Setup & Dependencies

### Task 1.1: Install Required Dependencies

**Priority**: High  
**Estimated Time**: 15 minutes

Install NestJS authentication packages:

```bash
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt passport-local bcrypt
pnpm add -D @types/passport-jwt @types/passport-local @types/bcrypt
```

**Dependencies for Google OAuth**:

```bash
pnpm add passport-google-oauth20
pnpm add -D @types/passport-google-oauth20
```

**Validation & Security**:

```bash
pnpm add class-validator class-transformer cookie-parser
pnpm add -D @types/cookie-parser
```

**Why these packages?**

- `@nestjs/passport` - NestJS wrapper for Passport.js integration
- `passport-google-oauth20` - The actual Google OAuth 2.0 strategy implementation
- `passport-jwt` - JWT authentication strategy
- `passport-local` - Local username/password strategy (optional, for reference)
- `bcrypt` - Password hashing
- `@nestjs/jwt` - JWT utilities for NestJS

**Acceptance Criteria**:

- [ ] All packages installed successfully
- [ ] TypeScript types available
- [ ] No dependency conflicts

---

### Task 1.2: Create Constants and Configuration

**Priority**: High  
**Estimated Time**: 20 minutes

**File**: `src/modules/auth/constants/auth.constants.ts`

```typescript
export const jwtConstants = {
  secret: process.env.JWT_SECRET,
  accessTokenExpiry: '7d', // 7 days to match Better Auth
  refreshTokenExpiry: '30d',
};

export const cookieConstants = {
  accessTokenName: 'leostack.access_token',
  refreshTokenName: 'leostack.refresh_token',
  sessionName: 'leostack.session_token',
};

export const authConstants = {
  bcryptSaltRounds: 10,
  googleCallbackUrl: `${process.env.API_BASE_URL}/auth/callback/google`,
};
```

**File**: `src/modules/auth/types/auth.types.ts`

```typescript
export interface JwtPayload {
  sub: string; // userId
  email: string;
  name: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
    emailVerified: boolean;
  };
  accessToken: string;
  refreshToken?: string;
}
```

**Acceptance Criteria**:

- [ ] Constants file created with environment variables
- [ ] Type definitions created
- [ ] Matches Better Auth configuration (cookie prefix, expiry times)

---

## Phase 2: Core Authentication Services

### Task 2.1: Create Password Hashing Utility

**Priority**: High  
**Estimated Time**: 15 minutes

**File**: `src/modules/auth/utils/password.util.ts`

```typescript
import * as bcrypt from 'bcrypt';
import { authConstants } from '../constants/auth.constants';

export class PasswordUtil {
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, authConstants.bcryptSaltRounds);
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
```

**Acceptance Criteria**:

- [ ] Password hashing implemented with bcrypt
- [ ] Password validation rules defined
- [ ] Utility functions are static and testable

---

### Task 2.2: Create Session Service

**Priority**: High  
**Estimated Time**: 45 minutes

**File**: `src/modules/auth/services/session.service.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class SessionService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createSession(userId: string, ipAddress?: string, userAgent?: string) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const session = await this.prisma.session.create({
      data: {
        id: randomBytes(16).toString('hex'),
        userId,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return session;
  }

  async getSession(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            emailVerified: true,
            image: true,
            role: true,
            phone: true,
            phoneVerified: true,
            profileCompleted: true,
            subscriptionId: true,
          },
        },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    if (session.expiresAt < new Date()) {
      await this.deleteSession(sessionId);
      throw new UnauthorizedException('Session expired');
    }

    return session;
  }

  async validateSessionToken(token: string) {
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return session;
  }

  async deleteSession(sessionId: string) {
    await this.prisma.session.delete({
      where: { id: sessionId },
    });
  }

  async deleteAllUserSessions(userId: string) {
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  async updateSession(sessionId: string) {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });
  }
}
```

**Acceptance Criteria**:

- [ ] Session creation generates unique tokens
- [ ] Session validation checks expiration
- [ ] Session cleanup methods implemented
- [ ] Sessions linked to users via Prisma relations

---

### Task 2.3: Create JWT Service Wrapper

**Priority**: High  
**Estimated Time**: 30 minutes

**File**: `src/modules/auth/services/token.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../types/auth.types';
import { jwtConstants } from '../constants/auth.constants';

@Injectable()
export class TokenService {
  constructor(private jwtService: JwtService) {}

  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: jwtConstants.secret,
      expiresIn: jwtConstants.accessTokenExpiry,
    });
  }

  generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: jwtConstants.secret,
      expiresIn: jwtConstants.refreshTokenExpiry,
    });
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: jwtConstants.secret,
    });
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: jwtConstants.secret,
    });
  }

  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }
}
```

**Acceptance Criteria**:

- [ ] Access token generation working
- [ ] Refresh token generation working
- [ ] Token verification with proper error handling
- [ ] Uses same expiry as Better Auth (7 days)

---

### Task 2.4: Create Core Authentication Service

**Priority**: Critical  
**Estimated Time**: 60 minutes

**File**: `src/modules/auth/services/auth.service.ts`

```typescript
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PasswordUtil } from '../utils/password.util';
import { SessionService } from './session.service';
import { TokenService } from './token.service';
import { AuthResponse, JwtPayload } from '../types/auth.types';

@Injectable()
export class AuthService {
  private prisma: PrismaClient;

  constructor(
    private sessionService: SessionService,
    private tokenService: TokenService,
  ) {
    this.prisma = new PrismaClient();
  }

  async signUpWithEmail(
    email: string,
    password: string,
    name: string,
  ): Promise<AuthResponse> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate password
    const passwordValidation = PasswordUtil.validate(password);
    if (!passwordValidation.valid) {
      throw new BadRequestException(passwordValidation.errors.join(', '));
    }

    // Hash password
    const hashedPassword = await PasswordUtil.hash(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        id: randomBytes(16).toString('hex'),
        email,
        name,
        emailVerified: false,
      },
    });

    // Create account with password
    await this.prisma.account.create({
      data: {
        id: randomBytes(16).toString('hex'),
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: hashedPassword,
      },
    });

    // Create session
    const session = await this.sessionService.createSession(user.id);

    // Generate tokens
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      sessionId: session.id,
    };

    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  async signInWithEmail(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Find credential account
    const account = await this.prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: 'credential',
      },
    });

    if (!account || !account.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await PasswordUtil.compare(
      password,
      account.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create session
    const session = await this.sessionService.createSession(
      user.id,
      ipAddress,
      userAgent,
    );

    // Generate tokens
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      sessionId: session.id,
    };

    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  async signOut(sessionId: string): Promise<void> {
    await this.sessionService.deleteSession(sessionId);
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);

    const session = await this.sessionService.getSession(payload.sessionId);

    const newPayload: JwtPayload = {
      sub: session.user.id,
      email: session.user.email,
      name: session.user.name,
      sessionId: session.id,
    };

    const newAccessToken = this.tokenService.generateAccessToken(newPayload);
    const newRefreshToken = this.tokenService.generateRefreshToken(newPayload);

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        emailVerified: session.user.emailVerified,
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
```

**Acceptance Criteria**:

- [ ] Email/password signup working
- [ ] Email/password signin working
- [ ] Sign out functionality
- [ ] Token refresh mechanism
- [ ] Passwords properly hashed with bcrypt

---

## Phase 3: OAuth Implementation

### Task 3.1: Create Google OAuth Strategy

**Priority**: High  
**Estimated Time**: 45 minutes

**File**: `src/modules/auth/strategies/google.strategy.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { GoogleProfile } from '../types/auth.types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private prisma: PrismaClient;

  constructor() {
    super({
      clientID: process.env.BETTER_AUTH_GOOGLE_ID,
      clientSecret: process.env.BETTER_AUTH_GOOGLE_SECRET,
      callbackURL: `${process.env.API_BASE_URL}/auth/callback/google`,
      scope: ['email', 'profile'],
    });
    this.prisma = new PrismaClient();
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName, photos } = profile;

    const email = emails[0].value;
    const isVerified = emails[0].verified;

    // Check if user exists
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          id: randomBytes(16).toString('hex'),
          email,
          name: displayName,
          image: photos?.[0]?.value,
          emailVerified: isVerified,
        },
      });
    }

    // Check if Google account is linked
    let account = await this.prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: 'google',
      },
    });

    if (!account) {
      // Link Google account
      account = await this.prisma.account.create({
        data: {
          id: randomBytes(16).toString('hex'),
          userId: user.id,
          accountId: id,
          providerId: 'google',
          accessToken,
          refreshToken,
        },
      });
    } else {
      // Update tokens
      await this.prisma.account.update({
        where: { id: account.id },
        data: {
          accessToken,
          refreshToken,
        },
      });
    }

    const googleProfile: GoogleProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.image,
      email_verified: user.emailVerified,
    };

    done(null, googleProfile);
  }
}
```

**Acceptance Criteria**:

- [ ] Google OAuth strategy configured
- [ ] User creation on first login
- [ ] Account linking working
- [ ] Token storage in database

---

### Task 3.2: Create Google OAuth Service

**Priority**: High  
**Estimated Time**: 30 minutes

**File**: `src/modules/auth/services/google-auth.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SessionService } from './session.service';
import { TokenService } from './token.service';
import { GoogleProfile, AuthResponse, JwtPayload } from '../types/auth.types';

@Injectable()
export class GoogleAuthService {
  private prisma: PrismaClient;

  constructor(
    private sessionService: SessionService,
    private tokenService: TokenService,
  ) {
    this.prisma = new PrismaClient();
  }

  async handleGoogleLogin(
    googleProfile: GoogleProfile,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: googleProfile.id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create session
    const session = await this.sessionService.createSession(
      user.id,
      ipAddress,
      userAgent,
    );

    // Generate tokens
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      sessionId: session.id,
    };

    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    };
  }
}
```

**Acceptance Criteria**:

- [ ] Google login handler creates sessions
- [ ] Tokens generated after OAuth
- [ ] User data returned properly

---

## Phase 4: Guards and Decorators

### Task 4.1: Create JWT Auth Guard

**Priority**: Critical  
**Estimated Time**: 45 minutes

**File**: `src/modules/auth/guards/jwt-auth.guard.ts`

```typescript
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  CanActivate,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { TokenService } from '../services/token.service';
import { SessionService } from '../services/session.service';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private tokenService: TokenService,
    private sessionService: SessionService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.tokenService.verifyAccessToken(token);

      // Validate session
      const session = await this.sessionService.getSession(payload.sessionId);

      // Attach user and session to request
      request['user'] = session.user;
      request['session'] = {
        id: session.id,
        expiresAt: session.expiresAt,
        userId: session.userId,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

**File**: `src/modules/auth/guards/session.guard.ts`

```typescript
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  CanActivate,
} from '@nestjs/common';
import { Request } from 'express';
import { SessionService } from '../services/session.service';
import { cookieConstants } from '../constants/auth.constants';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionToken = request.cookies?.[cookieConstants.sessionName];

    if (!sessionToken) {
      throw new UnauthorizedException('No session found');
    }

    try {
      const session =
        await this.sessionService.validateSessionToken(sessionToken);

      if (!session) {
        throw new UnauthorizedException('Invalid session');
      }

      request['user'] = session.user;
      request['session'] = {
        id: session.id,
        expiresAt: session.expiresAt,
        userId: session.userId,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid session');
    }
  }
}
```

**Acceptance Criteria**:

- [ ] JWT guard validates tokens
- [ ] Session guard validates session cookies
- [ ] Both guards attach user to request
- [ ] Proper error handling

---

### Task 4.2: Create Custom Decorators

**Priority**: Medium  
**Estimated Time**: 20 minutes

**File**: `src/modules/auth/decorators/public.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../guards/jwt-auth.guard';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**File**: `src/modules/auth/decorators/current-user.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const CurrentSession = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.session;
  },
);
```

**Acceptance Criteria**:

- [ ] Public decorator allows unauthenticated access
- [ ] CurrentUser decorator extracts user from request
- [ ] CurrentSession decorator extracts session

---

## Phase 5: DTOs and Validation

### Task 5.1: Create Authentication DTOs

**Priority**: High  
**Estimated Time**: 30 minutes

**File**: `src/modules/auth/dto/auth.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class SignUpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;
}

export class SignInDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123' })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class AuthResponseDto {
  @ApiProperty()
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
    emailVerified: boolean;
  };

  @ApiProperty()
  accessToken: string;

  @ApiProperty({ required: false })
  @IsOptional()
  refreshToken?: string;
}
```

**Acceptance Criteria**:

- [ ] DTOs created with validation
- [ ] Swagger documentation added
- [ ] Matches existing DTO patterns

---

## Phase 6: Controllers

### Task 6.1: Create Auth Controller

**Priority**: Critical  
**Estimated Time**: 60 minutes

**File**: `src/modules/auth/controllers/auth.controller.ts`

```typescript
import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { GoogleAuthService } from '../services/google-auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '../decorators/public.decorator';
import {
  CurrentUser,
  CurrentSession,
} from '../decorators/current-user.decorator';
import {
  SignUpDto,
  SignInDto,
  RefreshTokenDto,
  AuthResponseDto,
} from '../dto/auth.dto';
import { cookieConstants } from '../constants/auth.constants';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private googleAuthService: GoogleAuthService,
  ) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Sign up with email and password' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async signUp(
    @Body() signUpDto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signUpWithEmail(
      signUpDto.email,
      signUpDto.password,
      signUpDto.name,
    );

    // Set cookies
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return result;
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async signIn(
    @Body() signInDto: SignInDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signInWithEmail(
      signInDto.email,
      signInDto.password,
      req.ip,
      req.headers['user-agent'],
    );

    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return result;
  }

  @Public()
  @Get('signin/google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Public()
  @Get('callback/google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const googleProfile = req.user as any;

    const result = await this.googleAuthService.handleGoogleLogin(
      googleProfile,
      req.ip,
      req.headers['user-agent'],
    );

    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    // Redirect to frontend
    res.redirect(`${process.env.APP_BASE_URL}/auth/callback`);
  }

  @Post('signout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign out and invalidate session' })
  async signOut(
    @CurrentSession() session: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.signOut(session.id);

    // Clear cookies
    this.clearAuthCookies(res);

    return { message: 'Signed out successfully' };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refreshTokens(
      refreshTokenDto.refreshToken,
    );

    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return result;
  }

  @Get('session')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current session' })
  async getSession(@CurrentUser() user: any, @CurrentSession() session: any) {
    return {
      user,
      session,
    };
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken?: string,
  ) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite:
        process.env.NODE_ENV === 'production'
          ? ('none' as const)
          : ('lax' as const),
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    res.cookie(cookieConstants.accessTokenName, accessToken, cookieOptions);

    if (refreshToken) {
      res.cookie(cookieConstants.refreshTokenName, refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    }
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie(cookieConstants.accessTokenName);
    res.clearCookie(cookieConstants.refreshTokenName);
    res.clearCookie(cookieConstants.sessionName);
  }
}
```

**Acceptance Criteria**:

- [ ] All auth endpoints implemented
- [ ] Cookie handling matches Better Auth
- [ ] Swagger documentation complete
- [ ] Google OAuth flow working

---

## Phase 7: Module Configuration

### Task 7.1: Create Auth Module

**Priority**: Critical  
**Estimated Time**: 30 minutes

**File**: `src/modules/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { GoogleAuthService } from './services/google-auth.service';
import { SessionService } from './services/session.service';
import { TokenService } from './services/token.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SessionGuard } from './guards/session.guard';
import { jwtConstants } from './constants/auth.constants';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: {
        expiresIn: jwtConstants.accessTokenExpiry,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleAuthService,
    SessionService,
    TokenService,
    GoogleStrategy,
    JwtAuthGuard,
    SessionGuard,
  ],
  exports: [
    AuthService,
    SessionService,
    TokenService,
    JwtAuthGuard,
    SessionGuard,
  ],
})
export class AuthModule {}
```

**Acceptance Criteria**:

- [ ] All services registered
- [ ] Guards available for export
- [ ] JWT module configured
- [ ] Passport module configured

---

### Task 7.2: Update App Module

**Priority**: High  
**Estimated Time**: 20 minutes

**File**: Update `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import Joi from 'joi';

// Remove Better Auth imports
// import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
// import { auth } from './modules/better-auth/auth';
// import { AuthController as BetterAuthController } from './modules/better-auth/auth.controller';
// import { UserModule as BetterUserModule } from './modules/better-auth/user/user.module';

// Add new auth module
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { UserModule } from './modules/user/user.module';
import { QueryModule } from './modules/query/query.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: Joi.object({
        PORT: Joi.number().required(),
        APP_NAME: Joi.string().required(),
        NODE_ENV: Joi.string().required(),
        API_BASE_URL: Joi.string().required(),
        APP_BASE_URL: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
        DIRECT_URL: Joi.string().required(),
        YOUTUBE_API_KEY: Joi.string().required(),
        SWAGGER_ROUTE: Joi.string().required(),
        SWAGGER_PASSWORD: Joi.string().required(),
        CORS_ORIGIN: Joi.string().optional().default('*'),

        // Replace Better Auth env vars with new ones
        JWT_SECRET: Joi.string().required(),
        BETTER_AUTH_GOOGLE_ID: Joi.string().required(),
        BETTER_AUTH_GOOGLE_SECRET: Joi.string().required(),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 150,
      },
    ]),
    AuthModule,
    UserModule,
    QueryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Global auth guard
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

**Acceptance Criteria**:

- [ ] Better Auth imports removed
- [ ] New AuthModule imported
- [ ] Global guard configured
- [ ] Environment validation updated

---

### Task 7.3: Update Main.ts for Cookies

**Priority**: High  
**Estimated Time**: 15 minutes

**File**: Update `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());

  // Cookie parser
  app.use(cookieParser());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: [
      process.env.APP_BASE_URL,
      'http://localhost:5173',
      'http://localhost:3001',
    ],
    credentials: true,
  });

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
```

**Acceptance Criteria**:

- [ ] Cookie parser middleware added
- [ ] CORS configured for credentials
- [ ] Validation pipe configured

---

## Phase 8: Migrate User Module

### Task 8.1: Update User Service

**Priority**: High  
**Estimated Time**: 30 minutes

Replace `@Session()` decorator with `@CurrentUser()` and `@CurrentSession()` in user service and controller.

**File**: Update `src/modules/user/user.controller.ts`

```typescript
// Replace all instances of:
// @Session() session: UserSession

// With:
// @CurrentUser() user: any, @CurrentSession() session: any

// Remove Better Auth imports
// import { Session, AllowAnonymous } from '@thallesp/nestjs-better-auth';
// import type { UserSession } from '@thallesp/nestjs-better-auth';

// Add new imports
import {
  CurrentUser,
  CurrentSession,
} from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
```

**Acceptance Criteria**:

- [ ] All Better Auth decorators replaced
- [ ] User endpoints still functional
- [ ] Public endpoints marked with @Public()

---

### Task 8.2: Update Query Module

**Priority**: Medium  
**Estimated Time**: 20 minutes

Update query module to use new auth decorators.

**File**: Update `src/modules/query/query.controller.ts`

Same pattern as user controller - replace Better Auth decorators.

**Acceptance Criteria**:

- [ ] Query endpoints use new decorators
- [ ] User context available in queries

---

## Phase 9: Environment Variables

### Task 9.1: Update .env.example

**Priority**: Medium  
**Estimated Time**: 10 minutes

**File**: Update `.env.example`

```env
# Application
PORT=3001
APP_NAME=InfoCollection
NODE_ENV=development
API_BASE_URL=http://localhost:3001
APP_BASE_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DIRECT_URL=postgresql://user:password@localhost:5432/dbname

# YouTube
YOUTUBE_API_KEY=your_youtube_api_key

# Swagger
SWAGGER_ROUTE=api-docs
SWAGGER_PASSWORD=your_swagger_password

# CORS
CORS_ORIGIN=*

# Authentication (replace BETTER_AUTH_SECRET with JWT_SECRET)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Google OAuth (keep existing var names for now)
BETTER_AUTH_GOOGLE_ID=your_google_client_id
BETTER_AUTH_GOOGLE_SECRET=your_google_client_secret
```

**Acceptance Criteria**:

- [ ] JWT_SECRET added
- [ ] Old BETTER_AUTH_SECRET removed
- [ ] All required variables documented

---

## Phase 10: Testing & Validation

### Task 10.1: Manual Testing Checklist

**Priority**: Critical  
**Estimated Time**: 60 minutes

**Test Cases**:

1. **Email/Password Authentication**
   - [ ] Sign up with new user
   - [ ] Sign in with correct credentials
   - [ ] Sign in with wrong password fails
   - [ ] Sign in with non-existent user fails

2. **Google OAuth**
   - [ ] Initiate Google login
   - [ ] Callback handles new user
   - [ ] Callback handles existing user
   - [ ] Account linking works

3. **Session Management**
   - [ ] Session created on login
   - [ ] Session validated on protected routes
   - [ ] Session expires correctly
   - [ ] Sign out deletes session

4. **Token Management**
   - [ ] Access token generated
   - [ ] Refresh token generated
   - [ ] Token refresh works
   - [ ] Expired token rejected

5. **User Endpoints**
   - [ ] GET /users/me returns user
   - [ ] PUT /users/me updates user
   - [ ] DELETE /users/me deletes user
   - [ ] GET /users/me/sessions lists sessions

6. **Cookies**
   - [ ] Cookies set on login
   - [ ] Cookies cleared on logout
   - [ ] Cookie security flags correct
   - [ ] CORS credentials working

**Acceptance Criteria**:

- [ ] All test cases passing
- [ ] No Better Auth functionality lost
- [ ] Performance similar or better

---

### Task 10.2: Create Migration Verification Script

**Priority**: Medium  
**Estimated Time**: 30 minutes

**File**: `scripts/verify-migration.sh`

```bash
#!/bin/bash

echo "Testing Authentication Endpoints..."

# Test signup
echo "1. Testing signup..."
SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","name":"Test User"}')

echo "Signup Response: $SIGNUP_RESPONSE"

# Test signin
echo "2. Testing signin..."
SIGNIN_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}')

ACCESS_TOKEN=$(echo $SIGNIN_RESPONSE | jq -r '.accessToken')
echo "Access Token: $ACCESS_TOKEN"

# Test protected route
echo "3. Testing protected route..."
USER_RESPONSE=$(curl -s -X GET http://localhost:3001/users/me \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "User Response: $USER_RESPONSE"

# Test signout
echo "4. Testing signout..."
SIGNOUT_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/signout \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Signout Response: $SIGNOUT_RESPONSE"

echo "Migration verification complete!"
```

**Acceptance Criteria**:

- [ ] Script tests all major flows
- [ ] Results clearly displayed
- [ ] Errors properly reported

---

## Phase 11: Cleanup & Documentation

### Task 11.1: Remove Better Auth Dependencies

**Priority**: Low  
**Estimated Time**: 15 minutes

Only after all tests pass:

```bash
npm uninstall better-auth @better-auth/core @thallesp/nestjs-better-auth
npm uninstall @better-auth/cli
```

Update package.json scripts to remove Better Auth references:

```json
{
  "scripts": {
    "prisma:local": "npx prisma generate && npx prisma migrate dev",
    "prisma:generate": "npx prisma generate"
  }
}
```

Delete Better Auth folder:

```bash
rm -rf src/modules/better-auth
```

**Acceptance Criteria**:

- [ ] Better Auth packages removed
- [ ] Scripts updated
- [ ] Better Auth folder deleted
- [ ] Application still works

---

### Task 11.2: Update API Documentation

**Priority**: Medium  
**Estimated Time**: 30 minutes

Update any README or documentation files to reflect the new authentication system.

**File**: Update `apps/api/README.md`

Add section:

````markdown
## Authentication

This API uses JWT-based authentication with the following features:

- Email/Password authentication
- Google OAuth 2.0
- Session management
- Token refresh mechanism

### Endpoints

- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Login with email/password
- `GET /auth/signin/google` - Initiate Google OAuth
- `GET /auth/callback/google` - Google OAuth callback
- `POST /auth/signout` - Logout
- `POST /auth/refresh` - Refresh access token
- `GET /auth/session` - Get current session

### Usage

```typescript
// Login
const response = await fetch('/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
  credentials: 'include',
});

const { accessToken, user } = await response.json();

// Use token
const userResponse = await fetch('/users/me', {
  headers: { Authorization: `Bearer ${accessToken}` },
  credentials: 'include',
});
```
````

```

**Acceptance Criteria**:
- [ ] Documentation updated
- [ ] Examples provided
- [ ] Migration notes added

---

## Task Checklist Summary

### Phase 1: Setup (2 tasks)
- [ ] Task 1.1: Install dependencies
- [ ] Task 1.2: Create constants and configuration

### Phase 2: Core Services (4 tasks)
- [ ] Task 2.1: Password hashing utility
- [ ] Task 2.2: Session service
- [ ] Task 2.3: Token service
- [ ] Task 2.4: Core auth service

### Phase 3: OAuth (2 tasks)
- [ ] Task 3.1: Google OAuth strategy
- [ ] Task 3.2: Google OAuth service

### Phase 4: Guards (2 tasks)
- [ ] Task 4.1: JWT and session guards
- [ ] Task 4.2: Custom decorators

### Phase 5: DTOs (1 task)
- [ ] Task 5.1: Create DTOs

### Phase 6: Controllers (1 task)
- [ ] Task 6.1: Auth controller

### Phase 7: Module Config (3 tasks)
- [ ] Task 7.1: Auth module
- [ ] Task 7.2: App module update
- [ ] Task 7.3: Main.ts update

### Phase 8: Migration (2 tasks)
- [ ] Task 8.1: Update user module
- [ ] Task 8.2: Update query module

### Phase 9: Environment (1 task)
- [ ] Task 9.1: Update .env.example

### Phase 10: Testing (2 tasks)
- [ ] Task 10.1: Manual testing
- [ ] Task 10.2: Verification script

### Phase 11: Cleanup (2 tasks)
- [ ] Task 11.1: Remove Better Auth
- [ ] Task 11.2: Update documentation

**Total: 22 tasks across 11 phases**

---

## Notes

1. **Do not run Phase 11 until all tests pass**
2. **Keep Better Auth running in parallel during migration**
3. **Test incrementally after each phase**
4. **Backup database before starting**
5. **Keep environment variables for Better Auth until migration complete**

---

## Rollback Plan

If migration fails:

1. Revert app.module.ts changes
2. Keep Better Auth imports
3. Remove new auth module from imports
4. Restore Better Auth decorators in user/query modules
5. Database remains unchanged (schema not modified)

---

## Success Criteria

Migration is successful when:

- [ ] All Better Auth functionality replicated
- [ ] Email/password auth working
- [ ] Google OAuth working
- [ ] Session management working
- [ ] All user endpoints working
- [ ] All query endpoints working
- [ ] Cookies properly set
- [ ] CORS working with credentials
- [ ] No Better Auth dependencies
- [ ] Documentation updated
```
