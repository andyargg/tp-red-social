import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Usuario } from '../usuarios/usuario.schema.js';

@Schema({ timestamps: true, collection: 'publicaciones' })
export class Publicacion {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Usuario.name,
    required: true,
    index: true,
  })
  autor: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  titulo: string;

  @Prop({ type: String, required: true, trim: true })
  mensaje: string;

  @Prop({ type: String, default: null })
  imagen: string | null;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: Usuario.name }],
    default: [],
  })
  meGusta: Types.ObjectId[];

  // baja lógica
  @Prop({ type: Boolean, default: true })
  activa: boolean;
}

export type PublicacionDocument = HydratedDocument<Publicacion>;

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);
