import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ImagenesModule } from '../imagenes/imagenes.module.js';
import { UsuariosDatosModule } from '../usuarios/usuarios-datos.module.js';
import { AuthController } from './auth.controller.js';
import { AdminGuard } from './admin.guard.js';
import { AuthService } from './auth.service.js';
import { JwtGuard } from './jwt.guard.js';

@Module({
  imports: [
    UsuariosDatosModule,
    ImagenesModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '3m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard, AdminGuard],
  exports: [JwtModule, JwtGuard, AdminGuard, AuthService, UsuariosDatosModule],
})
export class AuthModule {}
