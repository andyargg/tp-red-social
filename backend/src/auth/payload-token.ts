import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Perfil, UsuarioDocument } from '../usuarios/usuario.schema.js';

export interface PayloadToken {
  sub: string;
  nombreUsuario: string;
  perfil: Perfil;
}

export const UsuarioToken = createParamDecorator(
  (_dato: unknown, ctx: ExecutionContext): PayloadToken =>
    ctx.switchToHttp().getRequest<{ usuario: PayloadToken }>().usuario,
);

export const UsuarioActual = createParamDecorator(
  (_dato: unknown, ctx: ExecutionContext): UsuarioDocument =>
    ctx.switchToHttp().getRequest<{ documentoUsuario: UsuarioDocument }>()
      .documentoUsuario,
);
