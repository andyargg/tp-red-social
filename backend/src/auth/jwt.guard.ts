import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { UsuarioDocument } from '../usuarios/usuario.schema.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { PayloadToken } from './payload-token.js';

export type RequestConUsuario = Request & {
  usuario?: PayloadToken;
  documentoUsuario?: UsuarioDocument;
};

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly usuarios: UsuariosService,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<RequestConUsuario>();
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
    req.documentoUsuario = usuario;
    return true;
  }
}
