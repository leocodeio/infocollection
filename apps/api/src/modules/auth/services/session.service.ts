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
