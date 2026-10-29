import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { PayloadToken } from '../auth/payload-token.js';
import { ImagenesService } from '../imagenes/imagenes.service.js';
import { Comentario } from './comentario.schema.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { ListarPublicacionesDto } from './dto/listar-publicaciones.dto.js';
import { PaginacionDto } from './dto/paginacion.dto.js';
import { Publicacion } from './publicacion.schema.js';

// datos públicos del autor que acompañan a publicaciones y comentarios
const DATOS_AUTOR = 'nombre apellido nombreUsuario imagenPerfil';
const PROYECCION_AUTOR = Object.fromEntries(
  DATOS_AUTOR.split(' ').map((campo) => [campo, 1]),
);

@Injectable()
export class PublicacionesService {
  constructor(
    @InjectModel(Publicacion.name)
    private readonly publicaciones: Model<Publicacion>,
    @InjectModel(Comentario.name)
    private readonly comentarios: Model<Comentario>,
    private readonly imagenes: ImagenesService,
  ) {}

  async crear(
    dto: CrearPublicacionDto,
    autor: string,
    imagen?: Express.Multer.File,
  ) {
    const url = imagen
      ? await this.imagenes.subir(imagen, 'publicaciones')
      : null;
    const publicacion = await this.publicaciones.create({
      autor: new Types.ObjectId(autor),
      titulo: dto.titulo,
      mensaje: dto.mensaje,
      imagen: url,
    });
    return this.detalle(publicacion._id, autor);
  }

  async listar(
    { orden, usuario, offset, limit }: ListarPublicacionesDto,
    yo: string,
  ) {
    const filtro: Record<string, unknown> = { activa: true };
    if (usuario) filtro.autor = new Types.ObjectId(usuario);

    // el _id desempata para que la paginación no repita ni saltee publicaciones
    const criterio: Record<string, 1 | -1> =
      orden === 'meGusta'
        ? { cantidadMeGusta: -1, createdAt: -1, _id: -1 }
        : { createdAt: -1, _id: -1 };

    const [publicaciones, total] = await Promise.all([
      this.publicaciones.aggregate([
        { $match: filtro },
        { $addFields: { cantidadMeGusta: { $size: '$meGusta' } } },
        { $sort: criterio },
        { $skip: offset },
        { $limit: limit },
        ...armarRespuesta(yo),
      ]),
      this.publicaciones.countDocuments(filtro),
    ]);
    return { publicaciones, total, offset, limit };
  }

  // baja lógica: solo el autor o un administrador
  async eliminar(id: string, usuario: PayloadToken) {
    const publicacion = await this.buscarActiva(id);
    const esAutor = publicacion.autor.equals(usuario.sub);
    if (!esAutor && usuario.perfil !== 'administrador') {
      throw new ForbiddenException(
        'Solo podés eliminar tus propias publicaciones',
      );
    }
    publicacion.activa = false;
    await publicacion.save();
  }

  // un solo me gusta por usuario: el filtro descarta a quien ya lo dio
  async darMeGusta(id: string, yo: string) {
    const { modifiedCount } = await this.publicaciones.updateOne(
      { _id: id, activa: true, meGusta: { $ne: yo } },
      { $addToSet: { meGusta: yo } },
    );
    if (!modifiedCount) {
      await this.buscarActiva(id);
      throw new ConflictException('Ya le diste me gusta a esta publicación');
    }
    return this.detalle(id, yo);
  }

  async quitarMeGusta(id: string, yo: string) {
    const { modifiedCount } = await this.publicaciones.updateOne(
      { _id: id, activa: true, meGusta: yo },
      { $pull: { meGusta: yo } },
    );
    if (!modifiedCount) {
      await this.buscarActiva(id);
      throw new ConflictException(
        'No le habías dado me gusta a esta publicación',
      );
    }
    return this.detalle(id, yo);
  }

  // los más recientes primero
  async listarComentarios(id: string, { offset, limit }: PaginacionDto) {
    await this.buscarActiva(id);
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

  private async buscarActiva(id: string) {
    const publicacion = await this.publicaciones.findOne({
      _id: id,
      activa: true,
    });
    if (!publicacion) {
      throw new NotFoundException('La publicación no existe o fue eliminada');
    }
    return publicacion;
  }

  private async detalle(id: string | Types.ObjectId, yo: string) {
    const [publicacion] = await this.publicaciones.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      ...armarRespuesta(yo),
    ]);
    return publicacion;
  }
}

// agrega el autor, los contadores y si el usuario que pide ya dio me gusta;
// la lista de ids de meGusta no se envía
function armarRespuesta(yo: string): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'usuarios',
        localField: 'autor',
        foreignField: '_id',
        as: 'autor',
        pipeline: [{ $project: PROYECCION_AUTOR }],
      },
    },
    { $unwind: '$autor' },
    {
      $lookup: {
        from: 'comentarios',
        localField: '_id',
        foreignField: 'publicacion',
        as: 'comentarios',
        pipeline: [{ $count: 'total' }],
      },
    },
    {
      $addFields: {
        cantidadMeGusta: { $size: '$meGusta' },
        meGustaYo: { $in: [new Types.ObjectId(yo), '$meGusta'] },
        cantidadComentarios: {
          $ifNull: [{ $first: '$comentarios.total' }, 0],
        },
      },
    },
    { $project: { meGusta: 0, comentarios: 0, activa: 0, __v: 0 } },
  ];
}
