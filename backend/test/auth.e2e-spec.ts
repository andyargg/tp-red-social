import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/configurar-app.js';

// PNG de 1x1 para probar la subida de la imagen de perfil
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

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

describe('Auth (e2e)', () => {
  let mongo: MongoMemoryServer;
  let app: NestExpressApplication;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri();
    process.env.JWT_SECRET = 'secreto-de-test';
    process.env.PUBLIC_URL = 'http://localhost:3000';

    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = modulo.createNestApplication<NestExpressApplication>();
    configurarApp(app);
    await app.init();
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
    await rm(join(process.cwd(), 'uploads', 'perfiles'), {
      recursive: true,
      force: true,
    });
  });

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

      const url = new URL(res.body.usuario.imagenPerfil);
      await request(app.getHttpServer()).get(url.pathname).expect(200);
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
});
