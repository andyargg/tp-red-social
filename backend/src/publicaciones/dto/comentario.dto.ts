import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Recortar } from '../../validacion/recortar.js';

export class ComentarioDto {
  @Recortar()
  @MaxLength(500, { message: 'El comentario puede tener hasta 500 caracteres' })
  @IsString({ message: 'El comentario no puede estar vacío' })
  @IsNotEmpty({ message: 'El comentario no puede estar vacío' })
  mensaje: string;
}
