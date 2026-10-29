import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  // correo o nombre de usuario
  @IsString({ message: 'Ingresá tu correo o nombre de usuario' })
  @IsNotEmpty({ message: 'Ingresá tu correo o nombre de usuario' })
  usuario: string;

  @IsString({ message: 'Ingresá tu contraseña' })
  @IsNotEmpty({ message: 'Ingresá tu contraseña' })
  password: string;
}
