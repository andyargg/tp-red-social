import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Publicacion, PublicacionSchema } from './publicacion.schema.js';

// las rutas para crear, listar y dar me gusta llegan en el sprint 2
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
    ]),
  ],
})
export class PublicacionesModule {}
