import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    return { id: user.id, email: user.email, role: user.role };
  }

  login(user: AuthUser) {
    return {
      token: this.signToken(user),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  verifyToken(token: string): AuthUser | null {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const expected = this.sign(payload);
    if (!this.safeEqual(signature, expected)) return null;

    try {
      const decoded = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      ) as AuthUser & { exp?: number };
      if (!decoded.id || !decoded.email || !decoded.role) return null;
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
    } catch {
      return null;
    }
  }

  private signToken(user: AuthUser) {
    const payload = Buffer.from(
      JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
      }),
    ).toString('base64url');
    return `${payload}.${this.sign(payload)}`;
  }

  private sign(payload: string) {
    return createHmac('sha256', this.secret())
      .update(payload)
      .digest('base64url');
  }

  private secret() {
    return (
      this.configService.get<string>('AUTH_SECRET') ?? 'dev-only-auth-secret'
    );
  }

  private safeEqual(a: string, b: string) {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
  }
}
