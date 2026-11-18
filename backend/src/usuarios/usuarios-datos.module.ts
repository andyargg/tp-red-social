import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImagenesModule } from '../imagenes/imagenes.module.js';
import { Usuario, UsuarioSchema } from './usuario.schema.js';
import { UsuariosService } from './usuarios.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }]),
    ImagenesModule,
  ],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosDatosModule {}
