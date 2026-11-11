import {
  Body,
  Controller,
  Get,
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
import { UsuarioToken } from './payload-token.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // multipart/form-data: los datos del usuario y un archivo "imagenPerfil" opcional
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

  // el front lo usa para refrescar los datos guardados al iniciar sesión
  @Get('yo')
  @UseGuards(JwtGuard)
  yo(@UsuarioToken() usuario: PayloadToken) {
    return this.auth.yo(usuario.sub);
  }
}
