import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { GoogleProfile } from '../types/auth.types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const apiBaseUrl = configService.get<string>('API_BASE_URL');

    if (!clientID || !clientSecret) {
      throw new Error(
        'Google OAuth credentials are not defined in environment variables',
      );
    }
    if (!apiBaseUrl) {
      throw new Error('API_BASE_URL is not defined in environment variables');
    }

    super({
      clientID,
      clientSecret,
      callbackURL: `${apiBaseUrl}/auth/callback/google`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const googleProfile: GoogleProfile = {
      id: id,
      sub: id,
      email: emails[0].value,
      name: `${name.givenName} ${name.familyName}`,
      picture: photos[0]?.value,
      email_verified: emails[0].verified || false,
      verified_email: emails[0].verified || false,
      access_token: accessToken,
      refresh_token: refreshToken,
    };

    done(null, googleProfile);
  }
}
