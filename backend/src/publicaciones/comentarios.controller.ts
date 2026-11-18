import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard.js';
import type { PayloadToken } from '../auth/payload-token.js';
import { UsuarioToken } from '../auth/payload-token.js';
import { IdValidoPipe } from '../validacion/id-valido.pipe.js';
import { ComentariosService } from './comentarios.service.js';
import { ComentarioDto } from './dto/comentario.dto.js';
import { PaginacionDto } from './dto/paginacion.dto.js';

@Controller('publicaciones/:id/comentarios')
@UseGuards(JwtGuard)
export class ComentariosController {
  constructor(private readonly comentarios: ComentariosService) {}

  @Get()
  listar(
    @Param('id', IdValidoPipe) id: string,
    @Query() paginacion: PaginacionDto,
  ) {
    return this.comentarios.listar(id, paginacion);
  }

  @Post()
  crear(
    @Param('id', IdValidoPipe) id: string,
    @Body() dto: ComentarioDto,
    @UsuarioToken() usuario: PayloadToken,
  ) {
    return this.comentarios.crear(id, dto, usuario.sub);
  }

  @Put(':comentarioId')
  editar(
    @Param('id', IdValidoPipe) id: string,
    @Param('comentarioId', IdValidoPipe) comentarioId: string,
    @Body() dto: ComentarioDto,
    @UsuarioToken() usuario: PayloadToken,
  ) {
    return this.comentarios.editar(id, comentarioId, dto, usuario.sub);
  }
}
