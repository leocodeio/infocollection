import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ description: 'User name', required: false })
  name?: string;

  @ApiProperty({ description: 'User email', required: false })
  email?: string;

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
}
