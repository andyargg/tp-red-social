import { getModelToken } from '@nestjs/mongoose';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Model } from 'mongoose';
import request from 'supertest';
import { Comentario } from '../src/publicaciones/comentario.schema.js';
import { Usuario } from '../src/usuarios/usuario.schema.js';
import { UsuariosService } from '../src/usuarios/usuarios.service.js';
import { PNG, crearAppDePrueba, crearImagenesFalso } from './app-de-prueba.js';

const imagenesFalso = crearImagenesFalso();

describe('Publicaciones (e2e)', () => {
  let app: NestExpressApplication;
  let cerrar: () => Promise<void>;
  // tokens y ids de los usuarios de prueba
  const ana = { token: '', id: '' };
  const beto = { token: '', id: '' };

  const api = () => request(app.getHttpServer());
  const como = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function registrar(nombreUsuario: string) {
    const res = await api()
      .post('/api/auth/registro')
      .field({
        nombre: nombreUsuario,
        apellido: 'Prueba',
        correo: `${nombreUsuario}@mail.com`,
        nombreUsuario,
        password: 'Secreta123',
        fechaNacimiento: '2000-01-01',
      })
      .expect(201);
    return { token: res.body.token, id: res.body.usuario._id };
  }

  function publicar(token: string, titulo: string, imagen?: Buffer) {
    const req = api()
      .post('/api/publicaciones')
      .set(como(token))
      .field({ titulo, mensaje: `Mensaje de ${titulo}` });
    if (imagen) req.attach('imagen', imagen, 'foto.png');
    return req;
  }

  beforeAll(async () => {
    ({ app, cerrar } = await crearAppDePrueba(imagenesFalso));
    Object.assign(ana, await registrar('ana'));
    Object.assign(beto, await registrar('beto'));
  }, 120_000);

  afterAll(() => cerrar?.());

  describe('autenticación', () => {
    it('responde 401 sin token', async () => {
      const res = await api().get('/api/publicaciones').expect(401);
      expect(res.body.message).toBe('Tenés que iniciar sesión');
    });

    it('responde 401 con un token inválido', async () => {
      await api()
        .get('/api/publicaciones')
        .set(como('no-es-un-token'))
        .expect(401);
    });
  });

  describe('POST /api/publicaciones', () => {
    it('crea una publicación con imagen asociada al usuario del token', async () => {
      const res = await publicar(ana.token, 'Primera', PNG).expect(201);
      expect(res.body).toMatchObject({
        titulo: 'Primera',
        mensaje: 'Mensaje de Primera',
        imagen:
          'https://res.cloudinary.com/test/image/upload/red-social/publicaciones/foto.png',
        autor: { _id: ana.id, nombreUsuario: 'ana' },
        cantidadMeGusta: 0,
        meGustaYo: false,
        cantidadComentarios: 0,
      });
      expect(res.body.meGusta).toBeUndefined();
      expect(res.body.autor.correo).toBeUndefined();
      expect(imagenesFalso.subidas.at(-1)?.carpeta).toBe('publicaciones');
    });

    it('crea una publicación sin imagen', async () => {
      const res = await publicar(beto.token, 'Sin foto').expect(201);
      expect(res.body.imagen).toBeNull();
    });

    it('rechaza una publicación sin título ni mensaje con 400', async () => {
      const res = await api()
        .post('/api/publicaciones')
        .set(como(ana.token))
        .field({ titulo: '' })
        .expect(400);
      expect(res.body.message).toEqual([
        'El título es obligatorio',
        'El mensaje es obligatorio',
      ]);
    });
  });

  describe('GET /api/publicaciones', () => {
    // publicaciones: Primera (ana), Sin foto (beto), luego tres más de ana
    beforeAll(async () => {
      for (const titulo of ['Tercera', 'Cuarta', 'Quinta']) {
        await publicar(ana.token, titulo).expect(201);
      }
    });

    it('lista por fecha, las más recientes primero, con el total', async () => {
      const res = await api()
        .get('/api/publicaciones')
        .set(como(ana.token))
        .expect(200);
      expect(res.body.total).toBe(5);
      expect(res.body.publicaciones.map((p: any) => p.titulo)).toEqual([
        'Quinta',
        'Cuarta',
        'Tercera',
        'Sin foto',
        'Primera',
      ]);
    });

    it('pagina con offset y limit', async () => {
      const res = await api()
        .get('/api/publicaciones?offset=2&limit=2')
        .set(como(ana.token))
        .expect(200);
      expect(res.body).toMatchObject({ total: 5, offset: 2, limit: 2 });
      expect(res.body.publicaciones.map((p: any) => p.titulo)).toEqual([
        'Tercera',
        'Sin foto',
      ]);
    });

    it('filtra por usuario', async () => {
      const res = await api()
        .get(`/api/publicaciones?usuario=${beto.id}`)
        .set(como(ana.token))
        .expect(200);
      expect(res.body.total).toBe(1);
      expect(res.body.publicaciones[0].titulo).toBe('Sin foto');
    });

    it('ordena por cantidad de me gusta', async () => {
      const { body } = await api()
        .get('/api/publicaciones')
        .set(como(ana.token));
      const [quinta, , tercera] = body.publicaciones;
      for (const yo of [ana, beto]) {
        await api()
          .post(`/api/publicaciones/${tercera._id}/me-gusta`)
          .set(como(yo.token))
          .expect(201);
      }
      await api()
        .post(`/api/publicaciones/${quinta._id}/me-gusta`)
        .set(como(beto.token))
        .expect(201);

      const res = await api()
        .get('/api/publicaciones?orden=meGusta&limit=3')
        .set(como(ana.token))
        .expect(200);
      expect(
        res.body.publicaciones.map((p: any) => [
          p.titulo,
          p.cantidadMeGusta,
          p.meGustaYo,
        ]),
      ).toEqual([
        ['Tercera', 2, true],
        ['Quinta', 1, false],
        ['Cuarta', 0, false],
      ]);
    });

    it('rechaza parámetros inválidos con 400', async () => {
      const res = await api()
        .get('/api/publicaciones?orden=azar&limit=0&usuario=123')
        .set(como(ana.token))
        .expect(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining([
          'orden debe ser "fecha" o "meGusta"',
          'limit debe ser al menos 1',
          'usuario debe ser un id válido',
        ]),
      );
    });
  });

  describe('me gusta', () => {
    let id: string;
    beforeAll(async () => {
      id = (await publicar(beto.token, 'Para likear')).body._id;
    });

    it('da me gusta una sola vez por usuario', async () => {
      const res = await api()
        .post(`/api/publicaciones/${id}/me-gusta`)
        .set(como(ana.token))
        .expect(201);
      expect(res.body).toMatchObject({ cantidadMeGusta: 1, meGustaYo: true });

      const repetido = await api()
        .post(`/api/publicaciones/${id}/me-gusta`)
        .set(como(ana.token))
        .expect(409);
      expect(repetido.body.message).toBe(
        'Ya le diste me gusta a esta publicación',
      );
    });

    it('quita el me gusta solo si se había dado', async () => {
      const res = await api()
        .delete(`/api/publicaciones/${id}/me-gusta`)
        .set(como(ana.token))
        .expect(200);
      expect(res.body).toMatchObject({ cantidadMeGusta: 0, meGustaYo: false });

      await api()
        .delete(`/api/publicaciones/${id}/me-gusta`)
        .set(como(ana.token))
        .expect(409);
    });

    it('responde 404 si la publicación no existe y 400 si el id es inválido', async () => {
      await api()
        .post('/api/publicaciones/64b000000000000000000000/me-gusta')
        .set(como(ana.token))
        .expect(404);
      await api()
        .post('/api/publicaciones/no-es-id/me-gusta')
        .set(como(ana.token))
        .expect(400);
    });
  });

  describe('DELETE /api/publicaciones/:id', () => {
    it('no deja eliminar la publicación de otro usuario', async () => {
      const id = (await publicar(beto.token, 'De beto')).body._id;
      const res = await api()
        .delete(`/api/publicaciones/${id}`)
        .set(como(ana.token))
        .expect(403);
      expect(res.body.message).toBe(
        'Solo podés eliminar tus propias publicaciones',
      );
    });

    it('el autor la da de baja y deja de listarse', async () => {
      const id = (await publicar(ana.token, 'Para borrar')).body._id;
      await api()
        .delete(`/api/publicaciones/${id}`)
        .set(como(ana.token))
        .expect(204);

      const { body } = await api()
        .get('/api/publicaciones?limit=50')
        .set(como(ana.token));
      expect(body.publicaciones.map((p: any) => p._id)).not.toContain(id);

      await api()
        .delete(`/api/publicaciones/${id}`)
        .set(como(ana.token))
        .expect(404);
    });

    it('un administrador puede eliminar cualquier publicación', async () => {
      const id = (await publicar(beto.token, 'Moderada')).body._id;
      await app.get(UsuariosService).cambiarPerfil('ana', 'administrador');
      // el perfil viaja en el token: hay que volver a ingresar
      const login = await api()
        .post('/api/auth/login')
        .send({ usuario: 'ana', password: 'Secreta123' })
        .expect(200);
      await api()
        .delete(`/api/publicaciones/${id}`)
        .set(como(login.body.token))
        .expect(204);
    });
  });

  describe('GET /api/publicaciones/:id/comentarios', () => {
    it('lista los comentarios paginados, los más recientes primero', async () => {
      const id = (await publicar(ana.token, 'Comentada')).body._id;
      const comentarios = app.get<Model<Comentario>>(
        getModelToken(Comentario.name),
      );
      for (const [i, autor] of [ana, beto, ana].entries()) {
        await comentarios.create({
          publicacion: id,
          autor: autor.id,
          mensaje: `Comentario ${i + 1}`,
        });
      }

      const res = await api()
        .get(`/api/publicaciones/${id}/comentarios?limit=2`)
        .set(como(beto.token))
        .expect(200);
      expect(res.body.total).toBe(3);
      expect(
        res.body.comentarios.map((c: any) => [
          c.mensaje,
          c.autor.nombreUsuario,
        ]),
      ).toEqual([
        ['Comentario 3', 'ana'],
        ['Comentario 2', 'beto'],
      ]);
      expect(res.body.comentarios[0].autor.password).toBeUndefined();

      const { body } = await api()
        .get('/api/publicaciones?limit=1')
        .set(como(beto.token));
      expect(body.publicaciones[0]).toMatchObject({
        titulo: 'Comentada',
        cantidadComentarios: 3,
      });
    });
  });

  describe('casos borde', () => {
    it('un título o mensaje con solo espacios responde 400, no 500', async () => {
      const res = await api()
        .post('/api/publicaciones')
        .set(como(beto.token))
        .field({ titulo: '   ', mensaje: '  ' })
        .expect(400);
      expect(res.body.message).toEqual([
        'El título es obligatorio',
        'El mensaje es obligatorio',
      ]);
    });

    it('un id de 12 caracteres que no es hexadecimal responde 400', async () => {
      await api()
        .post('/api/publicaciones/abcdefghijkl/me-gusta')
        .set(como(beto.token))
        .expect(400);
    });

    it('un administrador que pasó a usuario ya no puede eliminar con su token viejo', async () => {
      const login = await api()
        .post('/api/auth/login')
        .send({ usuario: 'ana', password: 'Secreta123' });
      expect(login.body.usuario.perfil).toBe('administrador');
      await app.get(UsuariosService).cambiarPerfil('ana', 'usuario');

      const id = (await publicar(beto.token, 'Ya no moderable')).body._id;
      await api()
        .delete(`/api/publicaciones/${id}`)
        .set(como(login.body.token))
        .expect(403);
    });

    it('un usuario deshabilitado no puede usar su token', async () => {
      const usuarios = app.get<Model<Usuario>>(getModelToken(Usuario.name));
      await usuarios.updateOne({ nombreUsuario: 'beto' }, { activo: false });
      const res = await api()
        .get('/api/publicaciones')
        .set(como(beto.token))
        .expect(401);
      expect(res.body.message).toBe(
        'Tu cuenta está deshabilitada. Contactá a un administrador.',
      );
    });
  });
});
