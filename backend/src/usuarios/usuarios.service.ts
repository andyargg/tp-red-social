import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from './usuario.schema.js';

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
    const valor = identificador.toLowerCase();
    return this.usuarios
      .findOne({ $or: [{ correo: valor }, { nombreUsuario: valor }] })
      .select('+password');
  }
}
