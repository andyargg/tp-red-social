import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { Comentario } from './comentario.schema.js';
import { RangoFechasDto } from './dto/rango-fechas.dto.js';
import { Publicacion } from './publicacion.schema.js';

const DIA = 24 * 60 * 60 * 1000;
const RANGO_POR_DEFECTO = 30 * DIA;
const RANGO_MAXIMO = 366 * DIA;
export const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';
const DESFASE_ARGENTINA = '-03:00';
const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

interface Rango {
  desde: Date;
  hasta: Date;
}

@Injectable()
export class EstadisticasService {
  constructor(
    @InjectModel(Publicacion.name)
    private readonly publicaciones: Model<Publicacion>,
    @InjectModel(Comentario.name)
    private readonly comentariosModelo: Model<Comentario>,
  ) {}

  async publicacionesPorUsuario(dto: RangoFechasDto) {
    const { desde, hasta } = rango(dto);
    const datos = await this.publicaciones.aggregate([
      { $match: { activa: true, createdAt: { $gte: desde, $lte: hasta } } },
      { $group: { _id: '$autor', cantidad: { $sum: 1 } } },
      {
        $lookup: {
          from: 'usuarios',
          localField: '_id',
          foreignField: '_id',
          as: 'usuario',
          pipeline: [
            { $project: { nombre: 1, apellido: 1, nombreUsuario: 1 } },
          ],
        },
      },
      { $unwind: '$usuario' },
      { $sort: { cantidad: -1, 'usuario.nombreUsuario': 1 } },
      { $project: { _id: 0, usuario: 1, cantidad: 1 } },
    ]);
    return { desde, hasta, datos };
  }

  async comentariosPorDia(dto: RangoFechasDto) {
    const { desde, hasta } = rango(dto);
    const porFecha = await this.comentariosModelo.aggregate<{
      _id: string;
      cantidad: number;
    }>([
      ...comentariosVisibles({ desde, hasta }),
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: ZONA_HORARIA,
            },
          },
          cantidad: { $sum: 1 },
        },
      },
    ]);
    const cantidades = new Map(porFecha.map((d) => [d._id, d.cantidad]));
    const porDia = diasEntre({ desde, hasta }).map((fecha) => ({
      fecha,
      cantidad: cantidades.get(fecha) ?? 0,
    }));
    const total = porDia.reduce((suma, d) => suma + d.cantidad, 0);
    return { desde, hasta, total, porDia };
  }

  async comentariosPorPublicacion(dto: RangoFechasDto) {
    const { desde, hasta } = rango(dto);
    const datos = await this.comentariosModelo.aggregate([
      ...comentariosVisibles({ desde, hasta }),
      {
        $group: {
          _id: '$publicacion',
          titulo: { $first: '$pub.titulo' },
          cantidad: { $sum: 1 },
        },
      },
      { $sort: { cantidad: -1, titulo: 1 } },
      {
        $project: {
          _id: 0,
          publicacion: { _id: '$_id', titulo: '$titulo' },
          cantidad: 1,
        },
      },
    ]);
    return { desde, hasta, datos };
  }
}

export function aFecha(valor: string, finDelDia: boolean): Date {
  if (!SOLO_FECHA.test(valor)) return new Date(valor);
  const hora = finDelDia ? '23:59:59.999' : '00:00:00.000';
  return new Date(`${valor}T${hora}${DESFASE_ARGENTINA}`);
}

function rango({ desde, hasta }: RangoFechasDto): Rango {
  const fin = hasta ? aFecha(hasta, true) : new Date();
  const inicio = desde
    ? aFecha(desde, false)
    : new Date(fin.getTime() - RANGO_POR_DEFECTO);
  if (inicio > fin) {
    throw new BadRequestException(
      'La fecha desde no puede ser posterior a hasta',
    );
  }
  if (fin.getTime() - inicio.getTime() > RANGO_MAXIMO) {
    throw new BadRequestException('El rango puede ser de hasta un año');
  }
  return { desde: inicio, hasta: fin };
}

function comentariosVisibles({ desde, hasta }: Rango): PipelineStage[] {
  return [
    { $match: { createdAt: { $gte: desde, $lte: hasta } } },
    {
      $lookup: {
        from: 'publicaciones',
        localField: 'publicacion',
        foreignField: '_id',
        as: 'pub',
        pipeline: [{ $match: { activa: true } }, { $project: { titulo: 1 } }],
      },
    },
    { $unwind: '$pub' },
  ];
}

const formatoDia = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function diasEntre({ desde, hasta }: Rango): string[] {
  const dias = new Set<string>();
  for (let t = desde.getTime(); t <= hasta.getTime(); t += DIA) {
    dias.add(formatoDia.format(new Date(t)));
  }
  dias.add(formatoDia.format(hasta));
  return [...dias];
}
