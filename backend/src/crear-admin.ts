import { HttpException, ValidationError } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { parseArgs } from 'node:util';
import { AppModule } from './app.module.js';
import { AuthService } from './auth/auth.service.js';
import { RegistroDto } from './auth/dto/registro.dto.js';
import { UsuariosService } from './usuarios/usuarios.service.js';

const AYUDA = `Uso:
  Convertir en administrador a un usuario que ya existe:
    npm run crear-admin -- <nombre de usuario o correo>

  Crear un administrador nuevo:
    npm run crear-admin -- --nombre Ana --apellido García --correo ana@mail.com \\
      --usuario ana.admin --password Admin1234 --nacimiento 1995-04-20 [--descripcion "..."]`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    nombre: { type: 'string' },
    apellido: { type: 'string' },
    correo: { type: 'string' },
    usuario: { type: 'string' },
    password: { type: 'string' },
    nacimiento: { type: 'string' },
    descripcion: { type: 'string' },
    ayuda: { type: 'boolean', short: 'h' },
  },
});

const crearNuevo = values.password !== undefined;
if (values.ayuda || (!crearNuevo && positionals.length !== 1)) {
  console.log(AYUDA);
  process.exit(values.ayuda ? 0 : 1);
}

const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ['error'],
});
try {
  if (crearNuevo) {
    const dto = plainToInstance(RegistroDto, {
      nombre: values.nombre,
      apellido: values.apellido,
      correo: values.correo,
      nombreUsuario: values.usuario,
      password: values.password,
      fechaNacimiento: values.nacimiento,
      descripcion: values.descripcion,
    });
    const errores = await validate(dto, { stopAtFirstError: true });
    if (errores.length) throw new Error(mensajes(errores).join('\n'));

    const { usuario } = await app
      .get(AuthService)
      .registro(dto, undefined, 'administrador');
    console.log(
      `Administrador creado: ${usuario.nombreUsuario} (${usuario.correo})`,
    );
  } else {
    const usuario = await app
      .get(UsuariosService)
      .cambiarPerfil(positionals[0], 'administrador');
    if (!usuario)
      throw new Error(
        `No existe un usuario con nombre de usuario o correo "${positionals[0]}"`,
      );
    console.log(
      `${usuario.nombreUsuario} (${usuario.correo}) ahora es administrador`,
    );
  }
} catch (error) {
  // los errores de la API (correo repetido, etc.) traen el mensaje en la respuesta
  const mensaje =
    error instanceof HttpException ? error.message : (error as Error).message;
  console.error(`Error: ${mensaje}`);
  process.exitCode = 1;
} finally {
  await app.close();
}

function mensajes(errores: ValidationError[]): string[] {
  return errores.flatMap((e) => Object.values(e.constraints ?? {}));
}
