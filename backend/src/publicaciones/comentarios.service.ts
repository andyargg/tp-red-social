import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comentario } from './comentario.schema.js';
import { ComentarioDto } from './dto/comentario.dto.js';
import { PaginacionDto } from './dto/paginacion.dto.js';
import { DATOS_AUTOR, PublicacionesService } from './publicaciones.service.js';

@Injectable()
export class ComentariosService {
  constructor(
    @InjectModel(Comentario.name)
    private readonly comentarios: Model<Comentario>,
    private readonly publicaciones: PublicacionesService,
  ) {}

  async listar(id: string, { offset, limit }: PaginacionDto) {
    await this.publicaciones.buscarActiva(id);
    const filtro = { publicacion: new Types.ObjectId(id) };
    const [comentarios, total] = await Promise.all([
      this.comentarios
        .find(filtro)
        .sort({ createdAt: -1, _id: -1 })
        .skip(offset)
        .limit(limit)
        .populate('autor', DATOS_AUTOR),
      this.comentarios.countDocuments(filtro),
    ]);
    return { comentarios, total, offset, limit };
  }

  async crear(id: string, { mensaje }: ComentarioDto, autor: string) {
    await this.publicaciones.buscarActiva(id);
    const comentario = await this.comentarios.create({
      publicacion: new Types.ObjectId(id),
      autor: new Types.ObjectId(autor),
      mensaje,
    });
    return comentario.populate('autor', DATOS_AUTOR);
  }

  async editar(
    id: string,
    comentarioId: string,
    { mensaje }: ComentarioDto,
    yo: string,
  ) {
    await this.publicaciones.buscarActiva(id);
    const comentario = await this.comentarios.findOne({
      _id: comentarioId,
      publicacion: id,
    });
    if (!comentario) {
      throw new NotFoundException('El comentario no existe');
    }
    if (!comentario.autor.equals(yo)) {
      throw new ForbiddenException('Solo podés editar tus propios comentarios');
    }
    comentario.mensaje = mensaje;
    comentario.modificado = true;
    await comentario.save();
    return comentario.populate('autor', DATOS_AUTOR);
  }
}
