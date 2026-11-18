import {
  Body,
  Controller,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtGuard } from '../auth/jwt.guard.js';
import type { PayloadToken } from '../auth/payload-token.js';
import { UsuarioToken } from '../auth/payload-token.js';
import { opcionesImagen } from '../imagenes/opciones-imagen.js';
import { EditarPerfilDto } from './dto/editar-perfil.dto.js';
import { UsuariosService } from './usuarios.service.js';

@Controller('usuarios')
@UseGuards(JwtGuard)
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Patch('yo')
  @UseInterceptors(FileInterceptor('imagenPerfil', opcionesImagen))
  editarPerfil(
    @Body() dto: EditarPerfilDto,
    @UsuarioToken() usuario: PayloadToken,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    return this.usuarios.editarPerfil(usuario.sub, dto, imagen);
  }
}
