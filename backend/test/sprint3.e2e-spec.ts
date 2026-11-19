import { JwtService } from '@nestjs/jwt';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PNG, crearAppDePrueba, crearImagenesFalso } from './app-de-prueba.js';

const imagenesFalso = crearImagenesFalso();

function payloadDe(token: string) {
  return JSON.parse(
    Buffer.from(token.split('.')[1], 'base64url').toString('utf8'),
  );
}

describe('Sprint 3: sesión, publicación, comentarios y perfil (e2e)', () => {
  let app: NestExpressApplication;
  let cerrar: () => Promise<void>;
  const ana = { token: '', id: '' };
  const beto = { token: '', id: '' };
  let publicacion = '';

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

  const comentar = (token: string, mensaje: string, id = publicacion) =>
    api()
      .post(`/api/publicaciones/${id}/comentarios`)
      .set(como(token))
      .send({ mensaje });

  beforeAll(async () => {
    ({ app, cerrar } = await crearAppDePrueba(imagenesFalso));
    Object.assign(ana, await registrar('ana'));
    Object.assign(beto, await registrar('beto'));
    const res = await api()
      .post('/api/publicaciones')
      .set(como(ana.token))
      .field({ titulo: 'Para comentar', mensaje: 'Hola' })
      .expect(201);
    publicacion = res.body._id;
  }, 120_000);

  afterAll(() => cerrar?.());

  describe('token', () => {
    it('el token de login vence a los 2 minutos y lleva id, usuario y perfil', () => {
      const payload = payloadDe(ana.token);
      expect(payload).toMatchObject({
        sub: ana.id,
        nombreUsuario: 'ana',
        perfil: 'usuario',
      });
      expect(payload.exp - payload.iat).toBe(2 * 60);
    });

    it('POST /api/auth/autorizar responde 200 con los datos del usuario', async () => {
      const res = await api()
        .post('/api/auth/autorizar')
        .set(como(ana.token))
        .expect(200);
      expect(res.body).toMatchObject({ _id: ana.id, nombreUsuario: 'ana' });
      expect(res.body.password).toBeUndefined();
    });

    it('autorizar y refrescar responden 401 con un token vencido o adulterado', async () => {
      const vencido = await new JwtService({
        secret: 'secreto-de-test',
      }).signAsync({
        sub: ana.id,
        nombreUsuario: 'ana',
        perfil: 'usuario',
        exp: Math.floor(Date.now() / 1000) - 10,
      });
      const adulterado = ana.token.slice(0, -2) + 'xx';
      for (const ruta of ['autorizar', 'refrescar']) {
        for (const token of [vencido, adulterado]) {
          const res = await api()
            .post(`/api/auth/${ruta}`)
            .set(como(token))
            .expect(401);
          expect(res.body.message).toBe('Tu sesión venció. Volvé a ingresar.');
        }
        await api().post(`/api/auth/${ruta}`).expect(401);
      }
    });

    it('POST /api/auth/refrescar devuelve un token nuevo con el mismo payload y 2 minutos más', async () => {
      const res = await api()
        .post('/api/auth/refrescar')
        .set(como(ana.token))
        .expect(200);
      const nuevo = payloadDe(res.body.token);
      const anterior = payloadDe(ana.token);
      expect(nuevo).toMatchObject({
        sub: anterior.sub,
        nombreUsuario: anterior.nombreUsuario,
        perfil: anterior.perfil,
      });
      expect(nuevo.exp - nuevo.iat).toBe(2 * 60);
      expect(nuevo.exp).toBeGreaterThanOrEqual(anterior.exp);
      await api()
        .post('/api/auth/autorizar')
        .set(como(res.body.token))
        .expect(200);
    });
  });

  describe('GET /api/publicaciones/:id', () => {
    it('devuelve la publicación con autor y contadores', async () => {
      const res = await api()
        .get(`/api/publicaciones/${publicacion}`)
        .set(como(beto.token))
        .expect(200);
      expect(res.body).toMatchObject({
        _id: publicacion,
        titulo: 'Para comentar',
        autor: { nombreUsuario: 'ana' },
        meGustaYo: false,
      });
      expect(res.body.meGusta).toBeUndefined();
    });

    it('responde 404 si no existe, 400 si el id no es válido y 401 sin token', async () => {
      await api()
        .get('/api/publicaciones/aaaaaaaaaaaaaaaaaaaaaaaa')
        .set(como(beto.token))
        .expect(404);
      await api()
        .get('/api/publicaciones/123')
        .set(como(beto.token))
        .expect(400);
      await api().get(`/api/publicaciones/${publicacion}`).expect(401);
    });
  });

  describe('comentarios', () => {
    it('POST crea el comentario con el autor del token y la fecha', async () => {
      const res = await comentar(beto.token, '  Buenísimo  ').expect(201);
      expect(res.body).toMatchObject({
        mensaje: 'Buenísimo',
        modificado: false,
        autor: { _id: beto.id, nombreUsuario: 'beto' },
      });
      expect(res.body.autor.password).toBeUndefined();
      expect(new Date(res.body.createdAt).getTime()).not.toBeNaN();

      const detalle = await api()
        .get(`/api/publicaciones/${publicacion}`)
        .set(como(ana.token));
      expect(detalle.body.cantidadComentarios).toBe(1);
    });

    it('POST valida el mensaje y la publicación', async () => {
      const vacio = await comentar(beto.token, '   ').expect(400);
      expect(vacio.body.message).toEqual([
        'El comentario no puede estar vacío',
      ]);
      await comentar(beto.token, 'x'.repeat(501)).expect(400);
      await comentar(beto.token, 'hola', 'aaaaaaaaaaaaaaaaaaaaaaaa').expect(
        404,
      );
      await api()
        .post(`/api/publicaciones/${publicacion}/comentarios`)
        .send({ mensaje: 'hola' })
        .expect(401);
    });

    it('GET los trae paginados, los más recientes primero', async () => {
      await comentar(ana.token, 'Segundo').expect(201);
      await comentar(beto.token, 'Tercero').expect(201);
      const res = await api()
        .get(`/api/publicaciones/${publicacion}/comentarios?limit=2`)
        .set(como(ana.token))
        .expect(200);
      expect(res.body.total).toBe(3);
      expect(res.body.comentarios.map((c: any) => c.mensaje)).toEqual([
        'Tercero',
        'Segundo',
      ]);
      const resto = await api()
        .get(`/api/publicaciones/${publicacion}/comentarios?offset=2&limit=2`)
        .set(como(ana.token))
        .expect(200);
      expect(resto.body.comentarios.map((c: any) => c.mensaje)).toEqual([
        'Buenísimo',
      ]);
    });

    it('PUT edita el mensaje y lo marca como modificado (solo el autor)', async () => {
      const { body } = await comentar(beto.token, 'Original').expect(201);
      const ruta = `/api/publicaciones/${publicacion}/comentarios/${body._id}`;

      const ajeno = await api()
        .put(ruta)
        .set(como(ana.token))
        .send({ mensaje: 'Hackeado' })
        .expect(403);
      expect(ajeno.body.message).toBe(
        'Solo podés editar tus propios comentarios',
      );

      const res = await api()
        .put(ruta)
        .set(como(beto.token))
        .send({ mensaje: 'Corregido' })
        .expect(200);
      expect(res.body).toMatchObject({
        _id: body._id,
        mensaje: 'Corregido',
        modificado: true,
        autor: { nombreUsuario: 'beto' },
      });

      await api()
        .put(ruta)
        .set(como(beto.token))
        .send({ mensaje: '' })
        .expect(400);
    });

    it('PUT responde 404 si el comentario no es de esa publicación', async () => {
      const { body } = await comentar(beto.token, 'De la primera').expect(201);
      const otra = await api()
        .post('/api/publicaciones')
        .set(como(beto.token))
        .field({ titulo: 'Otra', mensaje: 'Otra' })
        .expect(201);
      await api()
        .put(`/api/publicaciones/${otra.body._id}/comentarios/${body._id}`)
        .set(como(beto.token))
        .send({ mensaje: 'Cambio' })
        .expect(404);
      await api()
        .put(`/api/publicaciones/${publicacion}/comentarios/123`)
        .set(como(beto.token))
        .send({ mensaje: 'Cambio' })
        .expect(400);
    });

    it('una publicación dada de baja ya no se puede ver ni comentar', async () => {
      const res = await api()
        .post('/api/publicaciones')
        .set(como(beto.token))
        .field({ titulo: 'Efímera', mensaje: 'Chau' })
        .expect(201);
      const id = res.body._id;
      const { body } = await comentar(ana.token, 'Antes', id).expect(201);
      await api()
        .delete(`/api/publicaciones/${id}`)
        .set(como(beto.token))
        .expect(204);

      await api()
        .get(`/api/publicaciones/${id}`)
        .set(como(ana.token))
        .expect(404);
      await comentar(ana.token, 'Después', id).expect(404);
      await api()
        .get(`/api/publicaciones/${id}/comentarios`)
        .set(como(ana.token))
        .expect(404);
      await api()
        .put(`/api/publicaciones/${id}/comentarios/${body._id}`)
        .set(como(ana.token))
        .send({ mensaje: 'Editado' })
        .expect(404);
    });
  });

  describe('PATCH /api/usuarios/yo', () => {
    it('cambia solo los campos enviados', async () => {
      const res = await api()
        .patch('/api/usuarios/yo')
        .set(como(ana.token))
        .field({ nombre: '  Ana María ', descripcion: 'Nueva descripción' })
        .expect(200);
      expect(res.body).toMatchObject({
        nombre: 'Ana María',
        apellido: 'Prueba',
        descripcion: 'Nueva descripción',
        nombreUsuario: 'ana',
      });
      expect(res.body.password).toBeUndefined();

      const yo = await api()
        .post('/api/auth/autorizar')
        .set(como(ana.token))
        .expect(200);
      expect(yo.body.nombre).toBe('Ana María');
    });

    it('sube una foto nueva, borra la reemplazada y la puede quitar', async () => {
      const subirFoto = () =>
        api()
          .patch('/api/usuarios/yo')
          .set(como(ana.token))
          .attach('imagenPerfil', PNG, 'foto.png')
          .expect(200);
      const primera = (await subirFoto()).body.imagenPerfil;
      expect(primera).toContain('red-social/perfiles');
      const segunda = (await subirFoto()).body.imagenPerfil;
      expect(segunda).not.toBe(primera);
      expect(imagenesFalso.eliminadas).toContain(primera);

      const sinFoto = await api()
        .patch('/api/usuarios/yo')
        .set(como(ana.token))
        .field({ quitarImagen: 'true' })
        .expect(200);
      expect(sinFoto.body.imagenPerfil).toBeNull();
      expect(imagenesFalso.eliminadas).toContain(segunda);
    });

    it('si dos registros iguales llegan a la vez, la foto del que pierde se borra', async () => {
      const subidasAntes = imagenesFalso.subidas.length;
      const eliminadasAntes = imagenesFalso.eliminadas.length;
      const registrarConFoto = () =>
        api()
          .post('/api/auth/registro')
          .field({
            nombre: 'Doble',
            apellido: 'Prueba',
            correo: 'doble@mail.com',
            nombreUsuario: 'doble',
            password: 'Secreta123',
            fechaNacimiento: '2000-01-01',
          })
          .attach('imagenPerfil', PNG, 'foto.png');
      const estados = await Promise.all([
        registrarConFoto().then((r) => r.status),
        registrarConFoto().then((r) => r.status),
      ]);
      expect(estados.sort((a, b) => a - b)).toEqual([201, 409]);
      const subidas = imagenesFalso.subidas.length - subidasAntes;
      const eliminadas = imagenesFalso.eliminadas.length - eliminadasAntes;
      expect(eliminadas).toBe(subidas - 1);
    });

    it('valida con las mismas reglas del registro', async () => {
      const res = await api()
        .patch('/api/usuarios/yo')
        .set(como(ana.token))
        .field({
          nombre: '   ',
          fechaNacimiento: '2999-01-01',
          descripcion: 'x'.repeat(201),
        })
        .expect(400);
      expect(res.body.message).toEqual([
        'El nombre no puede quedar vacío',
        'La fecha de nacimiento no puede ser futura ni anterior a 1900',
        'La descripción puede tener hasta 200 caracteres',
      ]);
      await api()
        .patch('/api/usuarios/yo')
        .set(como(ana.token))
        .attach('imagenPerfil', Buffer.from('no soy imagen'), 'a.txt')
        .expect(400);
    });

    it('no permite cambiar el perfil, el correo ni el nombre de usuario', async () => {
      const res = await api()
        .patch('/api/usuarios/yo')
        .set(como(beto.token))
        .field({
          perfil: 'administrador',
          correo: 'otro@mail.com',
          nombreUsuario: 'otro',
        })
        .expect(200);
      expect(res.body).toMatchObject({
        perfil: 'usuario',
        correo: 'beto@mail.com',
        nombreUsuario: 'beto',
      });
    });

    it('responde 401 sin token', async () => {
      await api().patch('/api/usuarios/yo').field({ nombre: 'X' }).expect(401);
    });
  });
});
