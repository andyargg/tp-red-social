import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { ImagenesService } from '../imagenes/imagenes.service.js';
import { Perfil, UsuarioDocument } from '../usuarios/usuario.schema.js';
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

  // la ruta pública nunca pasa "perfil": solo el script crear-admin (y el sprint 4) crean administradores
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
      .catch(duplicadoComoConflicto);
    return this.sesion(usuario);
  }

  // datos actuales del usuario del token (el perfil o la foto pueden haber cambiado)
  async yo(id: string) {
    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario) throw new NotFoundException('El usuario no existe');
    return usuario;
  }

  async login(dto: LoginDto) {
    const usuario = await this.usuarios.buscarParaLogin(dto.usuario);
    // misma respuesta para un usuario inexistente y una contraseña incorrecta
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

  private async sesion(usuario: UsuarioDocument) {
    const token = await this.jwt.signAsync({
      sub: usuario.id,
      nombreUsuario: usuario.nombreUsuario,
      perfil: usuario.perfil,
    });
    return { usuario: usuario.toJSON(), token };
  }
}

// si dos registros iguales llegan a la vez, ambos pasan los exists() y el índice único
// de Mongo rechaza al segundo (E11000): se responde 409 como en el caso normal
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
