import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User name' })
  name: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'Email verification status' })
  emailVerified: boolean;

  @ApiProperty({ description: 'User avatar/image URL', required: false })
  image?: string;

  @ApiProperty({ description: 'User role', required: false })
  role?: string;

  @ApiProperty({ description: 'Phone number', required: false })
  phone?: string;

  @ApiProperty({ description: 'Phone verification status', required: false })
  phoneVerified?: boolean;

  @ApiProperty({ description: 'Profile completion status', required: false })
  profileCompleted?: boolean;

  @ApiProperty({ description: 'Subscription ID', required: false })
  subscriptionId?: string;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class SessionResponseDto {
  @ApiProperty({ description: 'Session ID' })
  id: string;

  @ApiProperty({ description: 'Session expiration date' })
  expiresAt: Date;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'IP address', required: false })
  ipAddress?: string;

  @ApiProperty({ description: 'User agent', required: false })
  userAgent?: string;

  @ApiProperty({ description: 'Session creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Session last update date' })
  updatedAt: Date;
}

export class UserWithSessionDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ type: SessionResponseDto })
  session: SessionResponseDto;
}

export class AccountResponseDto {
  @ApiProperty({ description: 'Account ID' })
  id: string;

  @ApiProperty({ description: 'Provider ID (e.g., google)' })
  providerId: string;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;
}

export class UserAccountsResponseDto extends UserResponseDto {
  @ApiProperty({ type: [AccountResponseDto] })
  accounts: AccountResponseDto[];
}
