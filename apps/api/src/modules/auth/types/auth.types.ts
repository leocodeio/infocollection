export interface JwtPayload {
  sub: string; // userId
  email: string;
  name: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface RequestUser {
  userId: string;
  email: string;
  name: string;
  sessionId: string;
}

export interface GoogleProfile {
  id: string;
  sub: string; // Google user ID
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
  verified_email?: boolean;
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    emailVerified: boolean;
  };
  accessToken: string;
  refreshToken?: string;
  session: {
    id: string;
    expiresAt: Date;
  };
}
