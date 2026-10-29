import { Recortar } from '../../validacion/recortar.js';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// class-validator evalúa primero el decorador de más abajo (ver RegistroDto)
export class CrearPublicacionDto {
  @Recortar()
  @MaxLength(100, { message: 'El título puede tener hasta 100 caracteres' })
  @IsString({ message: 'El título es obligatorio' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  titulo: string;

  @Recortar()
  @MaxLength(1000, { message: 'El mensaje puede tener hasta 1000 caracteres' })
  @IsString({ message: 'El mensaje es obligatorio' })
  @IsNotEmpty({ message: 'El mensaje es obligatorio' })
  mensaje: string;
}
