import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service.js';
import { RegistroDto } from '../src/auth/dto/registro.dto.js';
import { UsuariosService } from '../src/usuarios/usuarios.service.js';
import { PNG, crearAppDePrueba, crearImagenesFalso } from './app-de-prueba.js';

const datosValidos = {
  nombre: 'Ana',
  apellido: 'García',
  correo: 'ana@mail.com',
  nombreUsuario: 'ana.garcia',
  password: 'Secreta123',
  fechaNacimiento: '2000-05-10',
  descripcion: 'Hola, soy Ana',
};

function registrar(
  app: NestExpressApplication,
  datos: Record<string, string>,
  imagen?: Buffer,
) {
  const req = request(app.getHttpServer()).post('/api/auth/registro');
  for (const [campo, valor] of Object.entries(datos)) req.field(campo, valor);
  if (imagen) req.attach('imagenPerfil', imagen, 'perfil.png');
  return req;
}

const imagenesFalso = crearImagenesFalso();

describe('Auth (e2e)', () => {
  let app: NestExpressApplication;
  let cerrar: () => Promise<void>;

  beforeAll(async () => {
    ({ app, cerrar } = await crearAppDePrueba(imagenesFalso));
  }, 120_000);

  afterAll(() => cerrar?.());

  describe('POST /api/auth/registro', () => {
    it('crea el usuario con perfil "usuario", guarda la imagen y no devuelve la contraseña', async () => {
      const res = await registrar(app, datosValidos, PNG).expect(201);

      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.usuario).toMatchObject({
        nombre: 'Ana',
        correo: 'ana@mail.com',
        nombreUsuario: 'ana.garcia',
        perfil: 'usuario',
        activo: true,
      });
      expect(res.body.usuario.password).toBeUndefined();

      expect(res.body.usuario.imagenPerfil).toBe(
        'https://res.cloudinary.com/test/image/upload/red-social/perfiles/foto.png',
      );
      expect(imagenesFalso.subidas).toEqual([
        { carpeta: 'perfiles', tamanio: PNG.length },
      ]);
    });

    it('no sube la imagen si los datos son inválidos', async () => {
      const antes = imagenesFalso.subidas.length;
      await registrar(
        app,
        { ...datosValidos, correo: 'no-es-correo' },
        PNG,
      ).expect(400);
      expect(imagenesFalso.subidas).toHaveLength(antes);
    });

    it('rechaza un correo repetido con 409', async () => {
      const res = await registrar(app, {
        ...datosValidos,
        nombreUsuario: 'otra',
      }).expect(409);
      expect(res.body.message).toBe('Ya existe una cuenta con ese correo');
    });

    it('rechaza un nombre de usuario repetido sin importar mayúsculas con 409', async () => {
      await registrar(app, {
        ...datosValidos,
        correo: 'otra@mail.com',
        nombreUsuario: 'ANA.GARCIA',
      }).expect(409);
    });

    it('rechaza una contraseña sin mayúscula ni número con 400', async () => {
      const res = await registrar(app, {
        ...datosValidos,
        correo: 'b@mail.com',
        nombreUsuario: 'b',
        password: 'debilisima',
      }).expect(400);
      expect(res.body.message).toContain(
        'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número',
      );
    });

    it('informa un solo error en español por cada campo inválido', async () => {
      const { apellido: _, ...sinApellido } = datosValidos;
      const res = await registrar(app, {
        ...sinApellido,
        correo: 'e@mail.com',
        nombreUsuario: 'emilia',
        nombre: 'x'.repeat(60),
      }).expect(400);
      expect(res.body.message).toEqual([
        'El nombre puede tener hasta 50 caracteres',
        'El apellido es obligatorio',
      ]);
    });

    it('ignora un perfil "administrador" enviado en el registro', async () => {
      const res = await registrar(app, {
        ...datosValidos,
        correo: 'c@mail.com',
        nombreUsuario: 'carla',
        perfil: 'administrador',
      }).expect(201);
      expect(res.body.usuario.perfil).toBe('usuario');
    });

    it('rechaza un archivo que no es imagen con 400', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/registro')
        .field({
          ...datosValidos,
          correo: 'd@mail.com',
          nombreUsuario: 'dario',
        })
        .attach('imagenPerfil', Buffer.from('hola'), 'notas.txt')
        .expect(400);
    });
  });

  it('GET /api/salud responde 200', async () => {
    await request(app.getHttpServer())
      .get('/api/salud')
      .expect(200, { estado: 'ok' });
  });

  describe('POST /api/auth/login', () => {
    it('ingresa con el nombre de usuario', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ usuario: 'ana.garcia', password: 'Secreta123' })
        .expect(200);
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.usuario.password).toBeUndefined();
      expect(res.body.usuario.descripcion).toBe('Hola, soy Ana');
    });

    it('ingresa con el correo', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ usuario: 'ANA@mail.com', password: 'Secreta123' })
        .expect(200);
    });

    it('rechaza una contraseña incorrecta con 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ usuario: 'ana.garcia', password: 'Otra12345' })
        .expect(401);
      expect(res.body.message).toBe('Usuario o contraseña incorrectos');
    });

    it('rechaza un usuario inexistente con 401', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ usuario: 'nadie', password: 'Secreta123' })
        .expect(401);
    });

    it('rechaza un body vacío con 400', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('perfil administrador (script crear-admin)', () => {
    it('convierte en administrador a un usuario existente por nombre de usuario o correo', async () => {
      const usuarios = app.get(UsuariosService);
      const actualizado = await usuarios.cambiarPerfil(
        ' ANA@mail.com ',
        'administrador',
      );
      expect(actualizado?.perfil).toBe('administrador');

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ usuario: 'ana.garcia', password: 'Secreta123' })
        .expect(200);
      expect(res.body.usuario.perfil).toBe('administrador');
    });

    it('devuelve null si el usuario no existe', async () => {
      expect(
        await app.get(UsuariosService).cambiarPerfil('nadie', 'administrador'),
      ).toBeNull();
    });

    it('crea un administrador nuevo con la contraseña encriptada', async () => {
      const dto = Object.assign(new RegistroDto(), {
        ...datosValidos,
        correo: 'admin@mail.com',
        nombreUsuario: 'admin',
      });
      const { usuario } = await app
        .get(AuthService)
        .registro(dto, undefined, 'administrador');
      expect(usuario.perfil).toBe('administrador');

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ usuario: 'admin', password: 'Secreta123' })
        .expect(200);
    });
  });
});
