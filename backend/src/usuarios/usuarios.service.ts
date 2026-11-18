import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ImagenesService } from '../imagenes/imagenes.service.js';
import { EditarPerfilDto } from './dto/editar-perfil.dto.js';
import { Perfil, Usuario, UsuarioDocument } from './usuario.schema.js';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name) private readonly usuarios: Model<Usuario>,
    private readonly imagenes: ImagenesService,
  ) {}

  async editarPerfil(
    id: string,
    dto: EditarPerfilDto,
    imagen?: Express.Multer.File,
  ) {
    const usuario = await this.usuarios.findById(id);
    if (!usuario) throw new NotFoundException('El usuario no existe');

    const { nombre, apellido, descripcion, fechaNacimiento, quitarImagen } =
      dto;
    if (nombre !== undefined) usuario.nombre = nombre;
    if (apellido !== undefined) usuario.apellido = apellido;
    if (descripcion !== undefined) usuario.descripcion = descripcion;
    if (fechaNacimiento !== undefined) {
      usuario.fechaNacimiento = new Date(fechaNacimiento);
    }

    const fotoAnterior = usuario.imagenPerfil;
    if (imagen) {
      usuario.imagenPerfil = await this.imagenes.subir(imagen, 'perfiles');
    } else if (quitarImagen) {
      usuario.imagenPerfil = null;
    }
    const fotoNueva = usuario.imagenPerfil;

    try {
      await usuario.save();
    } catch (error) {
      if (fotoNueva !== fotoAnterior) await this.imagenes.eliminar(fotoNueva);
      throw error;
    }
    if (fotoNueva !== fotoAnterior) await this.imagenes.eliminar(fotoAnterior);
    return usuario;
  }

  crear(datos: Omit<Usuario, 'activo'>): Promise<UsuarioDocument> {
    return this.usuarios.create(datos);
  }

  existeCorreo(correo: string) {
    return this.usuarios.exists({ correo: correo.toLowerCase() });
  }

  existeNombreUsuario(nombreUsuario: string) {
    return this.usuarios.exists({ nombreUsuario: nombreUsuario.toLowerCase() });
  }

  buscarPorId(id: string) {
    return this.usuarios.findById(id);
  }

  buscarParaLogin(identificador: string) {
    return this.usuarios
      .findOne(porIdentificador(identificador))
      .select('+password');
  }

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
