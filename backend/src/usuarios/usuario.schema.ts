import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const PERFILES = ['usuario', 'administrador'] as const;
export type Perfil = (typeof PERFILES)[number];

@Schema({ timestamps: true, collection: 'usuarios' })
export class Usuario {
  @Prop({ type: String, required: true, trim: true })
  nombre: string;

  @Prop({ type: String, required: true, trim: true })
  apellido: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  correo: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  nombreUsuario: string;

  @Prop({ type: String, required: true, select: false })
  password: string;

  @Prop({ type: Date, required: true })
  fechaNacimiento: Date;

  @Prop({ type: String, default: '', trim: true })
  descripcion: string;

  @Prop({ type: String, default: null })
  imagenPerfil: string | null;

  @Prop({ type: String, enum: PERFILES, default: 'usuario' })
  perfil: Perfil;

  @Prop({ type: Boolean, default: true })
  activo: boolean;
}

export type UsuarioDocument = HydratedDocument<Usuario>;

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);

UsuarioSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    delete (ret as Partial<Usuario>).password;
    return ret;
  },
});
