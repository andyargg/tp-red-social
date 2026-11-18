import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { FechaPasada } from '../../validacion/fecha-pasada.js';
import { Recortar } from '../../validacion/recortar.js';

export class EditarPerfilDto {
  @Recortar()
  @IsOptional()
  @MaxLength(50, { message: 'El nombre puede tener hasta 50 caracteres' })
  @IsString({ message: 'El nombre no puede quedar vacío' })
  @IsNotEmpty({ message: 'El nombre no puede quedar vacío' })
  nombre?: string;

  @Recortar()
  @IsOptional()
  @MaxLength(50, { message: 'El apellido puede tener hasta 50 caracteres' })
  @IsString({ message: 'El apellido no puede quedar vacío' })
  @IsNotEmpty({ message: 'El apellido no puede quedar vacío' })
  apellido?: string;

  @IsOptional()
  @FechaPasada({
    message: 'La fecha de nacimiento no puede ser futura ni anterior a 1900',
  })
  @IsDateString({}, { message: 'La fecha de nacimiento no es válida' })
  fechaNacimiento?: string;

  @Recortar()
  @IsOptional()
  @MaxLength(200, {
    message: 'La descripción puede tener hasta 200 caracteres',
  })
  @IsString({ message: 'La descripción debe ser un texto' })
  descripcion?: string;

  @IsOptional()
  @IsBoolean({ message: 'quitarImagen debe ser true o false' })
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  quitarImagen?: boolean;
}
