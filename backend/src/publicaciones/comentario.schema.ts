import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Usuario } from '../usuarios/usuario.schema.js';
import { Publicacion } from './publicacion.schema.js';

@Schema({ timestamps: true, collection: 'comentarios' })
export class Comentario {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Publicacion.name,
    required: true,
    index: true,
  })
  publicacion: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Usuario.name,
    required: true,
  })
  autor: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  mensaje: string;

  // se marca al editar el comentario (sprint 3)
  @Prop({ type: Boolean, default: false })
  modificado: boolean;
}

export type ComentarioDocument = HydratedDocument<Comentario>;

export const ComentarioSchema = SchemaFactory.createForClass(Comentario);
ComentarioSchema.set('toJSON', { versionKey: false });
