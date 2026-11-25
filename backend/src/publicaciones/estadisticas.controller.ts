import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { JwtGuard } from '../auth/jwt.guard.js';
import { RangoFechasDto } from './dto/rango-fechas.dto.js';
import { EstadisticasService } from './estadisticas.service.js';

@Controller('estadisticas')
@UseGuards(JwtGuard, AdminGuard)
export class EstadisticasController {
  constructor(private readonly estadisticas: EstadisticasService) {}

  @Get('publicaciones-por-usuario')
  publicacionesPorUsuario(@Query() rango: RangoFechasDto) {
    return this.estadisticas.publicacionesPorUsuario(rango);
  }

  @Get('comentarios')
  comentarios(@Query() rango: RangoFechasDto) {
    return this.estadisticas.comentariosPorDia(rango);
  }

  @Get('comentarios-por-publicacion')
  comentariosPorPublicacion(@Query() rango: RangoFechasDto) {
    return this.estadisticas.comentariosPorPublicacion(rango);
  }
}
