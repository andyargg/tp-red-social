import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PASSWORD_REGEX, PASSWORD_MENSAJE } from './password.js';

// con stopAtFirstError se informa un solo error por campo, y class-validator evalúa
// primero el decorador de más abajo: por eso "obligatorio" va al final
export class RegistroDto {
  @MaxLength(50, { message: 'El nombre puede tener hasta 50 caracteres' })
  @IsString({ message: 'El nombre es obligatorio' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @MaxLength(50, { message: 'El apellido puede tener hasta 50 caracteres' })
  @IsString({ message: 'El apellido es obligatorio' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  apellido: string;

  @IsEmail({}, { message: 'El correo no es válido' })
  correo: string;

  @Matches(/^[a-zA-Z0-9._]{3,20}$/, {
    message:
      'El nombre de usuario debe tener entre 3 y 20 letras, números, puntos o guiones bajos',
  })
  nombreUsuario: string;

  @Matches(PASSWORD_REGEX, { message: PASSWORD_MENSAJE })
  password: string;

  @IsDateString({}, { message: 'La fecha de nacimiento no es válida' })
  fechaNacimiento: string;

  @IsOptional()
  @MaxLength(200, {
    message: 'La descripción puede tener hasta 200 caracteres',
  })
  @IsString({ message: 'La descripción debe ser un texto' })
  descripcion?: string;
}
