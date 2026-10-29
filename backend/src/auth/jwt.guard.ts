import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { PayloadToken } from './payload-token.js';

// exige un header "Authorization: Bearer <token>" válido y no vencido, de un usuario
// que siga habilitado; el perfil se toma de la base para que un cambio rija enseguida
@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly usuarios: UsuariosService,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { usuario?: PayloadToken }>();
    const [tipo, token] = req.headers.authorization?.split(' ') ?? [];
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Tenés que iniciar sesión');
    }

    let payload: PayloadToken;
    try {
      payload = await this.jwt.verifyAsync<PayloadToken>(token);
    } catch {
      throw new UnauthorizedException('Tu sesión venció. Volvé a ingresar.');
    }

    const usuario = await this.usuarios.buscarPorId(payload.sub);
    if (!usuario?.activo) {
      throw new UnauthorizedException(
        'Tu cuenta está deshabilitada. Contactá a un administrador.',
      );
    }
    req.usuario = { ...payload, perfil: usuario.perfil };
    return true;
  }
}
