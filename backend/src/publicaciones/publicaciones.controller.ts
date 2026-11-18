import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtGuard } from '../auth/jwt.guard.js';
import type { PayloadToken } from '../auth/payload-token.js';
import { UsuarioToken } from '../auth/payload-token.js';
import { IdValidoPipe } from '../validacion/id-valido.pipe.js';
import { opcionesImagen } from '../imagenes/opciones-imagen.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { ListarPublicacionesDto } from './dto/listar-publicaciones.dto.js';
import { PublicacionesService } from './publicaciones.service.js';

@Controller('publicaciones')
@UseGuards(JwtGuard)
export class PublicacionesController {
  constructor(private readonly publicaciones: PublicacionesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('imagen', opcionesImagen))
  crear(
    @Body() dto: CrearPublicacionDto,
    @UsuarioToken() usuario: PayloadToken,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    return this.publicaciones.crear(dto, usuario.sub, imagen);
  }

  @Get()
  listar(
    @Query() filtros: ListarPublicacionesDto,
    @UsuarioToken() usuario: PayloadToken,
  ) {
    return this.publicaciones.listar(filtros, usuario.sub);
  }

  @Get(':id')
  obtener(
    @Param('id', IdValidoPipe) id: string,
    @UsuarioToken() usuario: PayloadToken,
  ) {
    return this.publicaciones.obtener(id, usuario.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(
    @Param('id', IdValidoPipe) id: string,
    @UsuarioToken() usuario: PayloadToken,
  ) {
    return this.publicaciones.eliminar(id, usuario);
  }

  @Post(':id/me-gusta')
  darMeGusta(
    @Param('id', IdValidoPipe) id: string,
    @UsuarioToken() usuario: PayloadToken,
  ) {
    return this.publicaciones.darMeGusta(id, usuario.sub);
  }

  @Delete(':id/me-gusta')
  quitarMeGusta(
    @Param('id', IdValidoPipe) id: string,
    @UsuarioToken() usuario: PayloadToken,
  ) {
    return this.publicaciones.quitarMeGusta(id, usuario.sub);
  }
}
