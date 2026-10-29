import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { ImagenesService } from '../imagenes/imagenes.service.js';
import { UsuarioDocument } from '../usuarios/usuario.schema.js';
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

  async registro(dto: RegistroDto, imagen?: Express.Multer.File) {
    if (await this.usuarios.existeCorreo(dto.correo)) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }
    if (await this.usuarios.existeNombreUsuario(dto.nombreUsuario)) {
      throw new ConflictException('Ese nombre de usuario ya está en uso');
    }

    const imagenPerfil = imagen
      ? await this.imagenes.subir(imagen, 'perfiles')
      : null;

    // acá el perfil siempre es "usuario": solo un administrador puede crear otro tipo
    const usuario = await this.usuarios.crear({
      nombre: dto.nombre,
      apellido: dto.apellido,
      correo: dto.correo,
      nombreUsuario: dto.nombreUsuario,
      password: await bcrypt.hash(dto.password, SALT_ROUNDS),
      fechaNacimiento: new Date(dto.fechaNacimiento),
      descripcion: dto.descripcion ?? '',
      imagenPerfil,
      perfil: 'usuario',
    });
    return this.sesion(usuario);
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
