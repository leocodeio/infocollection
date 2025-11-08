import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import { PasswordUtil } from '../utils/password.util';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { JwtPayload, AuthResponse, GoogleProfile } from '../types/auth.types';

@Injectable()
export class AuthService {
  private prisma: PrismaClient;

  constructor(
    private tokenService: TokenService,
    private sessionService: SessionService,
  ) {
    this.prisma = new PrismaClient();
  }

  async registerWithEmail(
    email: string,
    password: string,
    name: string,
  ): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate password
    const validation = PasswordUtil.validate(password);
    if (!validation.valid) {
      throw new ConflictException(validation.errors.join(', '));
    }

    // Hash password
    const hashedPassword = await PasswordUtil.hash(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        id: this.generateUserId(),
        email,
        name,
        emailVerified: false,
      },
    });

    // Create account with password
    await this.prisma.account.create({
      data: {
        id: this.generateAccountId(),
        accountId: email,
        providerId: 'credential',
        userId: user.id,
        password: hashedPassword,
      },
    });

    // Create session and tokens
    return this.createAuthSession(user);
  }

  async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          where: { providerId: 'credential' },
        },
      },
    });

    if (!user || !user.accounts.length) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const account = user.accounts[0];
    if (!account.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await PasswordUtil.compare(
      password,
      account.password,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create session and tokens
    return this.createAuthSession(user);
  }

  async loginWithGoogle(profile: GoogleProfile): Promise<AuthResponse> {
    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          id: this.generateUserId(),
          email: profile.email,
          name: profile.name,
          emailVerified: profile.verified_email || false,
          image: profile.picture,
        },
      });
    }

    // Find or create account
    let account = await this.prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: 'google',
        accountId: profile.sub,
      },
    });

    if (!account) {
      account = await this.prisma.account.create({
        data: {
          id: this.generateAccountId(),
          accountId: profile.sub,
          providerId: 'google',
          userId: user.id,
          accessToken: profile.access_token,
          refreshToken: profile.refresh_token,
          idToken: profile.id_token,
        },
      });
    } else {
      // Update tokens
      account = await this.prisma.account.update({
        where: { id: account.id },
        data: {
          accessToken: profile.access_token,
          refreshToken: profile.refresh_token,
          idToken: profile.id_token,
        },
      });
    }

    // Create session and tokens
    return this.createAuthSession(user);
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    // Verify refresh token
    let payload: JwtPayload;
    try {
      payload = await this.tokenService.verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Verify session exists and is valid
    const session = await this.sessionService.getSession(payload.sessionId);
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new tokens
    const newPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      sessionId: session.id,
    };

    const accessToken = this.tokenService.generateAccessToken(newPayload);
    const newRefreshToken = this.tokenService.generateRefreshToken(newPayload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        image: user.image,
      },
      accessToken,
      refreshToken: newRefreshToken,
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionService.deleteSession(sessionId);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          where: { providerId: 'credential' },
        },
      },
    });

    if (!user || !user.accounts.length || !user.accounts[0].password) {
      return null;
    }

    const isValidPassword = await PasswordUtil.compare(
      password,
      user.accounts[0].password,
    );

    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  private async createAuthSession(user: User): Promise<AuthResponse> {
    // Create session
    const sessionData = await this.sessionService.createSession(
      user.id,
      undefined, // IP address can be added from request context
      undefined, // User agent can be added from request context
    );

    // Generate tokens
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      sessionId: sessionData.id,
    };

    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        image: user.image,
      },
      accessToken,
      refreshToken,
      session: {
        id: sessionData.id,
        expiresAt: sessionData.expiresAt,
      },
    };
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateAccountId(): string {
    return `acc_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}
