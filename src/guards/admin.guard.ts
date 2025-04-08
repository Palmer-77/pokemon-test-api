import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

@Injectable()
export class AdminGuard extends AuthGuard {
  async canActivate(context: any): Promise<boolean> {
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const isAdmin = user.role?.key === 'admin' || user.role?.key === 'super_admin';
    if (!isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }

    return true;
  }
}
