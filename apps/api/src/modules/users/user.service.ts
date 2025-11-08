import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Account, PrismaClient, User } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        phone: true,
        phoneVerified: true,
        profileCompleted: true,
        subscriptionId: true,
        createdAt: true,
        updatedAt: true,
      },
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Get user with accounts (linked providers)
   */
  async getUserWithAccounts(
    userId: string,
  ): Promise<User & { accounts: Account[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          select: {
            id: true,
            providerId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user) as User & { accounts: Account[] };
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updateData: UpdateUserDto): Promise<User> {
    // If email is being updated, check if it's already taken
    if (updateData.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateData.email },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email already in use');
      }
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          role: true,
          phone: true,
          phoneVerified: true,
          profileCompleted: true,
          subscriptionId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return this.sanitizeUser(updatedUser);
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Failed to update user profile: ' + error);
    }
  }

  /**
   * Delete user account (soft delete or hard delete)
   */
  async deleteUser(userId: string) {
    try {
      // Delete all related data due to cascade
      await this.prisma.user.delete({
        where: { id: userId },
      });

      return { message: 'Account deleted successfully' };
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Failed to delete user account: ' + error);
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId: userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }));
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Cannot revoke session of another user');
    }

    await this.prisma.session.delete({
      where: { id: sessionId },
    });

    return { message: 'Session revoked successfully' };
  }

  /**
   * Revoke all sessions except current
   */
  async revokeAllOtherSessions(userId: string, currentSessionId: string) {
    await this.prisma.session.deleteMany({
      where: {
        userId: userId,
        id: {
          not: currentSessionId,
        },
      },
    });

    return { message: 'All other sessions revoked successfully' };
  }

  /**
   * Remove sensitive fields from user object
   */
  private sanitizeUser(user: User): User {
    return user;
  }

  /**
   * Check if user has Google account linked
   */
  async hasGoogleAccount(userId: string): Promise<boolean> {
    const googleAccount = await this.prisma.account.findFirst({
      where: {
        userId: userId,
        providerId: 'google',
      },
    });

    return !!googleAccount;
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    const activeSessions = await this.prisma.session.count({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    return {
      activeSessions,
    };
  }
}
