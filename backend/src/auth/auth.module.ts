import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ImagenesModule } from '../imagenes/imagenes.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtGuard } from './jwt.guard.js';

@Module({
  imports: [
    UsuariosModule,
    ImagenesModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard],
  // los demás módulos protegen sus rutas con JwtGuard, que usa JwtService y UsuariosService
  exports: [JwtModule, JwtGuard, UsuariosModule],
})
export class AuthModule {}
