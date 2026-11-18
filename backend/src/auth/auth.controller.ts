import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { opcionesImagen } from '../imagenes/opciones-imagen.js';
import { AuthService } from './auth.service.js';
import { JwtGuard } from './jwt.guard.js';
import type { PayloadToken } from './payload-token.js';
import { UsuarioActual, UsuarioToken } from './payload-token.js';
import type { UsuarioDocument } from '../usuarios/usuario.schema.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('registro')
  @UseInterceptors(FileInterceptor('imagenPerfil', opcionesImagen))
  registro(
    @Body() dto: RegistroDto,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    return this.auth.registro(dto, imagen);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('autorizar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  autorizar(@UsuarioActual() usuario: UsuarioDocument) {
    return usuario;
  }

  @Post('refrescar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  refrescar(@UsuarioToken() usuario: PayloadToken) {
    return this.auth.refrescar(usuario);
  }
}
