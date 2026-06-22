import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    return { id: user.id, email: user.email, role: user.role };
  }

  login(user: { id: string; email: string; role: string }) {
    return {
      token: Buffer.from(`${user.id}:${user.email}`).toString('base64'),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}
