import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService, AuthUser } from './auth.service';
import { ROLES_KEY } from './roles.decorator';

interface RequestWithAuth {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Authentication required');

    const user = this.authService.verifyToken(token);
    if (!user) throw new UnauthorizedException('Invalid authentication token');

    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (roles?.length && !roles.includes(user.role)) {
      throw new UnauthorizedException('Insufficient permissions');
    }

    request.user = user;
    return true;
  }

  private extractToken(request: RequestWithAuth) {
    const authorization = this.headerValue(request.headers.authorization);
    if (authorization?.startsWith('Bearer ')) {
      return authorization.slice('Bearer '.length);
    }

    const cookie = this.headerValue(request.headers.cookie);
    const match = cookie?.match(/(?:^|;\s*)auth-token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : undefined;
  }

  private headerValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
  }
}
