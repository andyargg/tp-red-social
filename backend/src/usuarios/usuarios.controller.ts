import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthService } from '../auth/auth.service.js';
import { JwtGuard } from '../auth/jwt.guard.js';
import type { PayloadToken } from '../auth/payload-token.js';
import { UsuarioToken } from '../auth/payload-token.js';
import { opcionesImagen } from '../imagenes/opciones-imagen.js';
import { IdValidoPipe } from '../validacion/id-valido.pipe.js';
import { CrearUsuarioDto } from './dto/crear-usuario.dto.js';
import { EditarPerfilDto } from './dto/editar-perfil.dto.js';
import { UsuariosService } from './usuarios.service.js';

@Controller('usuarios')
@UseGuards(JwtGuard)
export class UsuariosController {
  constructor(
    private readonly usuarios: UsuariosService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  @UseGuards(AdminGuard)
  listar() {
    return this.usuarios.listar();
  }

  @Post()
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('imagenPerfil', opcionesImagen))
  crear(
    @Body() dto: CrearUsuarioDto,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    return this.auth.crearUsuario(dto, imagen, dto.perfil);
  }

  @Patch('yo')
  @UseInterceptors(FileInterceptor('imagenPerfil', opcionesImagen))
  editarPerfil(
    @Body() dto: EditarPerfilDto,
    @UsuarioToken() usuario: PayloadToken,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    return this.usuarios.editarPerfil(usuario.sub, dto, imagen);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  deshabilitar(
    @Param('id', IdValidoPipe) id: string,
    @UsuarioToken() admin: PayloadToken,
  ) {
    return this.usuarios.cambiarEstado(id, false, admin.sub);
  }

  @Post(':id/habilitar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminGuard)
  habilitar(
    @Param('id', IdValidoPipe) id: string,
    @UsuarioToken() admin: PayloadToken,
  ) {
    return this.usuarios.cambiarEstado(id, true, admin.sub);
  }
}
