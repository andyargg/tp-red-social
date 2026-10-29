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

  // correo y nombreUsuario se guardan en minúsculas para que la unicidad no distinga mayúsculas
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

  // baja lógica: un usuario deshabilitado no puede ingresar (sprint 4)
  @Prop({ type: Boolean, default: true })
  activo: boolean;
}

export type UsuarioDocument = HydratedDocument<Usuario>;

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);

// nunca se envía el hash de la contraseña, aunque se haya pedido para validar el login
UsuarioSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    delete (ret as Partial<Usuario>).password;
    return ret;
  },
});
