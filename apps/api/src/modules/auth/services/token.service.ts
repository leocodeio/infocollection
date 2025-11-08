import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../types/auth.types';
import { authConstants } from '../constants/auth.constants';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  generateAccessToken(payload: JwtPayload): string {
    const { sub, email, name, sessionId } = payload;
    const jwtSecret = this.configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    return this.jwtService.sign(
      { sub, email, name, sessionId },
      {
        secret: jwtSecret,
        expiresIn: authConstants.accessTokenExpiry as any,
      },
    );
  }

  generateRefreshToken(payload: JwtPayload): string {
    const { sub, email, name, sessionId } = payload;
    const jwtSecret = this.configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    return this.jwtService.sign(
      { sub, email, name, sessionId },
      {
        secret: jwtSecret,
        expiresIn: authConstants.refreshTokenExpiry as any,
      },
    );
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: jwtSecret,
    });
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: jwtSecret,
    });
  }

  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }
}
