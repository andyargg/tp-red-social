import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Perfil, Usuario, UsuarioDocument } from './usuario.schema.js';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name) private readonly usuarios: Model<Usuario>,
  ) {}

  crear(datos: Omit<Usuario, 'activo'>): Promise<UsuarioDocument> {
    return this.usuarios.create(datos);
  }

  existeCorreo(correo: string) {
    return this.usuarios.exists({ correo: correo.toLowerCase() });
  }

  existeNombreUsuario(nombreUsuario: string) {
    return this.usuarios.exists({ nombreUsuario: nombreUsuario.toLowerCase() });
  }

  // el login acepta el correo o el nombre de usuario en el mismo campo
  buscarParaLogin(identificador: string) {
    return this.usuarios
      .findOne(porIdentificador(identificador))
      .select('+password');
  }

  // devuelve el usuario actualizado, o null si no existe
  cambiarPerfil(identificador: string, perfil: Perfil) {
    return this.usuarios.findOneAndUpdate(
      porIdentificador(identificador),
      { perfil },
      { returnDocument: 'after' },
    );
  }
}

function porIdentificador(identificador: string) {
  const valor = identificador.trim().toLowerCase();
  return { $or: [{ correo: valor }, { nombreUsuario: valor }] };
}
