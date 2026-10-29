import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Perfil } from '../usuarios/usuario.schema.js';

// datos que viajan dentro del JWT
export interface PayloadToken {
  sub: string;
  nombreUsuario: string;
  perfil: Perfil;
}

// @UsuarioToken() en un parámetro del controller: el payload que dejó JwtGuard
export const UsuarioToken = createParamDecorator(
  (_dato: unknown, ctx: ExecutionContext): PayloadToken =>
    ctx.switchToHttp().getRequest<{ usuario: PayloadToken }>().usuario,
);
