import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { RequestConUsuario } from './jwt.guard.js';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<RequestConUsuario>();
    if (req.usuario?.perfil !== 'administrador') {
      throw new ForbiddenException('Solo un administrador puede hacer esto');
    }
    return true;
  }
}
