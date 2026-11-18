import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { ImagenesService } from '../imagenes/imagenes.service.js';
import { Perfil, UsuarioDocument } from '../usuarios/usuario.schema.js';
import { PayloadToken } from './payload-token.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarios: UsuariosService,
    private readonly jwt: JwtService,
    private readonly imagenes: ImagenesService,
  ) {}

  async registro(
    dto: RegistroDto,
    imagen?: Express.Multer.File,
    perfil: Perfil = 'usuario',
  ) {
    if (await this.usuarios.existeCorreo(dto.correo)) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }
    if (await this.usuarios.existeNombreUsuario(dto.nombreUsuario)) {
      throw new ConflictException('Ese nombre de usuario ya está en uso');
    }

    const imagenPerfil = imagen
      ? await this.imagenes.subir(imagen, 'perfiles')
      : null;

    const usuario = await this.usuarios
      .crear({
        nombre: dto.nombre,
        apellido: dto.apellido,
        correo: dto.correo,
        nombreUsuario: dto.nombreUsuario,
        password: await bcrypt.hash(dto.password, SALT_ROUNDS),
        fechaNacimiento: new Date(dto.fechaNacimiento),
        descripcion: dto.descripcion ?? '',
        imagenPerfil,
        perfil,
      })
      .catch(async (error: unknown) => {
        await this.imagenes.eliminar(imagenPerfil);
        return duplicadoComoConflicto(error);
      });
    return this.sesion(usuario);
  }

  async login(dto: LoginDto) {
    const usuario = await this.usuarios.buscarParaLogin(dto.usuario);
    if (!usuario || !(await bcrypt.compare(dto.password, usuario.password))) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }
    if (!usuario.activo) {
      throw new ForbiddenException(
        'Tu cuenta está deshabilitada. Contactá a un administrador.',
      );
    }
    return this.sesion(usuario);
  }

  async refrescar({ sub, nombreUsuario, perfil }: PayloadToken) {
    return { token: await this.firmar({ sub, nombreUsuario, perfil }) };
  }

  private async sesion(usuario: UsuarioDocument) {
    const token = await this.firmar({
      sub: usuario.id,
      nombreUsuario: usuario.nombreUsuario,
      perfil: usuario.perfil,
    });
    return { usuario: usuario.toJSON(), token };
  }

  private firmar(payload: PayloadToken) {
    return this.jwt.signAsync(payload);
  }
}

function duplicadoComoConflicto(error: unknown): never {
  const { code, keyPattern } = error as {
    code?: number;
    keyPattern?: Record<string, unknown>;
  };
  if (code === 11000) {
    throw new ConflictException(
      keyPattern?.correo
        ? 'Ya existe una cuenta con ese correo'
        : 'Ese nombre de usuario ya está en uso',
    );
  }
  throw error;
}
