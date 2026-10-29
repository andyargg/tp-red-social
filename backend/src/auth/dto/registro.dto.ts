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

export class RegistroDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(50, { message: 'El nombre puede tener hasta 50 caracteres' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @MaxLength(50, { message: 'El apellido puede tener hasta 50 caracteres' })
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
  @IsString()
  @MaxLength(200, {
    message: 'La descripción puede tener hasta 200 caracteres',
  })
  descripcion?: string;
}
