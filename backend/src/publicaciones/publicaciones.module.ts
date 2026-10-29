import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';
import { ImagenesModule } from '../imagenes/imagenes.module.js';
import { Comentario, ComentarioSchema } from './comentario.schema.js';
import { Publicacion, PublicacionSchema } from './publicacion.schema.js';
import { PublicacionesController } from './publicaciones.controller.js';
import { PublicacionesService } from './publicaciones.service.js';

@Module({
  imports: [
    AuthModule,
    ImagenesModule,
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Comentario.name, schema: ComentarioSchema },
    ]),
  ],
  controllers: [PublicacionesController],
  providers: [PublicacionesService],
})
export class PublicacionesModule {}
