import { NestExpressApplication } from '@nestjs/platform-express';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import request from 'supertest';
import { Comentario } from '../src/publicaciones/comentario.schema.js';
import {
  aFecha,
  diasEntre,
} from '../src/publicaciones/estadisticas.service.js';
import { UsuariosService } from '../src/usuarios/usuarios.service.js';
import { PNG, crearAppDePrueba, crearImagenesFalso } from './app-de-prueba.js';

const imagenesFalso = crearImagenesFalso();

describe('Sprint 4: administración de usuarios y estadísticas (e2e)', () => {
  let app: NestExpressApplication;
  let cerrar: () => Promise<void>;
  const admin = { token: '', id: '' };
  const ana = { token: '', id: '' };
  const beto = { token: '', id: '' };

  const api = () => request(app.getHttpServer());
  const como = (token: string) => ({ Authorization: `Bearer ${token}` });

  const datosDe = (nombreUsuario: string) => ({
    nombre: nombreUsuario,
    apellido: 'Prueba',
    correo: `${nombreUsuario}@mail.com`,
    nombreUsuario,
    password: 'Secreta123',
    fechaNacimiento: '2000-01-01',
  });

  async function registrar(nombreUsuario: string) {
    const res = await api()
      .post('/api/auth/registro')
      .field(datosDe(nombreUsuario))
      .expect(201);
    return { token: res.body.token, id: res.body.usuario._id };
  }

  const login = (usuario: string) =>
    api().post('/api/auth/login').send({ usuario, password: 'Secreta123' });

  async function publicar(token: string, titulo: string) {
    const res = await api()
      .post('/api/publicaciones')
      .set(como(token))
      .field({ titulo, mensaje: 'Hola' })
      .expect(201);
    return res.body._id as string;
  }

  const comentar = (token: string, id: string, mensaje = 'Buenísimo') =>
    api()
      .post(`/api/publicaciones/${id}/comentarios`)
      .set(como(token))
      .send({ mensaje })
      .expect(201);

  beforeAll(async () => {
    ({ app, cerrar } = await crearAppDePrueba(imagenesFalso));
    Object.assign(admin, await registrar('jefa'));
    await app.get(UsuariosService).cambiarPerfil('jefa', 'administrador');
    Object.assign(ana, await registrar('ana'));
    Object.assign(beto, await registrar('beto'));
  }, 120_000);

  afterAll(() => cerrar?.());

  describe('usuarios', () => {
    it('solo un administrador puede usar las rutas de usuarios', async () => {
      await api().get('/api/usuarios').expect(401);
      const res = await api().get('/api/usuarios').set(como(ana.token));
      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Solo un administrador puede hacer esto');
      await api()
        .post('/api/usuarios')
        .set(como(ana.token))
        .field({ ...datosDe('colado'), perfil: 'administrador' })
        .expect(403);
      await api()
        .delete(`/api/usuarios/${beto.id}`)
        .set(como(ana.token))
        .expect(403);
      await api()
        .post(`/api/usuarios/${beto.id}/habilitar`)
        .set(como(ana.token))
        .expect(403);
    });

    it('GET /api/usuarios lista a todos sin la contraseña', async () => {
      const res = await api()
        .get('/api/usuarios')
        .set(como(admin.token))
        .expect(200);
      const nombres = res.body.map(
        (u: { nombreUsuario: string }) => u.nombreUsuario,
      );
      expect(nombres).toEqual(expect.arrayContaining(['jefa', 'ana', 'beto']));
      for (const usuario of res.body) {
        expect(usuario.password).toBeUndefined();
        expect(typeof usuario.activo).toBe('boolean');
        expect(['usuario', 'administrador']).toContain(usuario.perfil);
      }
    });

    it('POST /api/usuarios crea un administrador con foto y puede ingresar', async () => {
      const res = await api()
        .post('/api/usuarios')
        .set(como(admin.token))
        .field({ ...datosDe('nueva.admin'), perfil: 'administrador' })
        .attach('imagenPerfil', PNG, {
          filename: 'foto.png',
          contentType: 'image/png',
        })
        .expect(201);
      expect(res.body).toMatchObject({
        nombreUsuario: 'nueva.admin',
        perfil: 'administrador',
        activo: true,
      });
      expect(res.body.imagenPerfil).toMatch(/perfiles\/foto\d+\.png$/);
      expect(res.body.password).toBeUndefined();
      expect(res.body.token).toBeUndefined();

      const sesion = await login('nueva.admin').expect(200);
      expect(sesion.body.usuario.perfil).toBe('administrador');
      await api().get('/api/usuarios').set(como(sesion.body.token)).expect(200);
    });

    it('POST /api/usuarios crea un usuario común', async () => {
      const res = await api()
        .post('/api/usuarios')
        .set(como(admin.token))
        .field({ ...datosDe('comun'), perfil: 'usuario' })
        .expect(201);
      expect(res.body.perfil).toBe('usuario');
    });

    it('POST /api/usuarios valida el perfil, los datos y los duplicados', async () => {
      const sinPerfil = await api()
        .post('/api/usuarios')
        .set(como(admin.token))
        .field(datosDe('sinperfil'))
        .expect(400);
      expect(sinPerfil.body.message).toContain(
        'El perfil debe ser usuario o administrador',
      );

      await api()
        .post('/api/usuarios')
        .set(como(admin.token))
        .field({ ...datosDe('raro'), perfil: 'superusuario' })
        .expect(400);

      await api()
        .post('/api/usuarios')
        .set(como(admin.token))
        .field({ ...datosDe('malo'), password: 'corta', perfil: 'usuario' })
        .expect(400);

      const duplicado = await api()
        .post('/api/usuarios')
        .set(como(admin.token))
        .field({ ...datosDe('ana'), perfil: 'usuario' })
        .expect(409);
      expect(duplicado.body.message).toBe(
        'Ya existe una cuenta con ese correo',
      );
    });

    it('DELETE /api/usuarios/:id deshabilita: no puede ingresar ni usar su token', async () => {
      const res = await api()
        .delete(`/api/usuarios/${beto.id}`)
        .set(como(admin.token))
        .expect(200);
      expect(res.body).toMatchObject({ _id: beto.id, activo: false });

      const intento = await login('beto').expect(403);
      expect(intento.body.message).toBe(
        'Tu cuenta está deshabilitada. Contactá a un administrador.',
      );
      const conToken = await api()
        .get('/api/publicaciones')
        .set(como(beto.token))
        .expect(401);
      expect(conToken.body.message).toBe(
        'Tu cuenta está deshabilitada. Contactá a un administrador.',
      );
    });

    it('POST /api/usuarios/:id/habilitar lo rehabilita', async () => {
      const res = await api()
        .post(`/api/usuarios/${beto.id}/habilitar`)
        .set(como(admin.token))
        .expect(200);
      expect(res.body).toMatchObject({ _id: beto.id, activo: true });
      await login('beto').expect(200);
      await api().get('/api/publicaciones').set(como(beto.token)).expect(200);
    });

    it('no se puede deshabilitar la propia cuenta ni un id inexistente o inválido', async () => {
      const propia = await api()
        .delete(`/api/usuarios/${admin.id}`)
        .set(como(admin.token))
        .expect(400);
      expect(propia.body.message).toBe(
        'No podés deshabilitar tu propia cuenta',
      );
      await api()
        .delete('/api/usuarios/000000000000000000000000')
        .set(como(admin.token))
        .expect(404);
      await api()
        .delete('/api/usuarios/abc')
        .set(como(admin.token))
        .expect(400);
      await api()
        .post('/api/usuarios/000000000000000000000000/habilitar')
        .set(como(admin.token))
        .expect(404);
    });
  });

  describe('estadísticas', () => {
    let deAna1 = '';
    let deAna2 = '';
    let deBeto = '';
    let borrada = '';

    beforeAll(async () => {
      deAna1 = await publicar(ana.token, 'Ana uno');
      deAna2 = await publicar(ana.token, 'Ana dos');
      deBeto = await publicar(beto.token, 'Beto uno');
      borrada = await publicar(beto.token, 'Se borra');
      await comentar(beto.token, deAna1);
      await comentar(admin.token, deAna1);
      await comentar(ana.token, deAna1);
      await comentar(ana.token, deBeto);
      await comentar(ana.token, borrada);
      await api()
        .delete(`/api/publicaciones/${borrada}`)
        .set(como(admin.token))
        .expect(204);
    });

    const rutas = [
      'publicaciones-por-usuario',
      'comentarios',
      'comentarios-por-publicacion',
    ];

    it('solo un administrador puede ver las estadísticas', async () => {
      for (const ruta of rutas) {
        await api().get(`/api/estadisticas/${ruta}`).expect(401);
        await api()
          .get(`/api/estadisticas/${ruta}`)
          .set(como(ana.token))
          .expect(403);
      }
    });

    it('publicaciones por usuario cuenta solo las activas del rango', async () => {
      const res = await api()
        .get('/api/estadisticas/publicaciones-por-usuario')
        .set(como(admin.token))
        .expect(200);
      expect(res.body.datos).toEqual([
        {
          usuario: expect.objectContaining({ nombreUsuario: 'ana' }),
          cantidad: 2,
        },
        {
          usuario: expect.objectContaining({ nombreUsuario: 'beto' }),
          cantidad: 1,
        },
      ]);
    });

    it('comentarios por día suma los del rango y completa los días sin comentarios', async () => {
      const hasta = new Date();
      const desde = new Date(hasta.getTime() - 6 * 24 * 60 * 60 * 1000);
      const res = await api()
        .get('/api/estadisticas/comentarios')
        .query({ desde: desde.toISOString(), hasta: hasta.toISOString() })
        .set(como(admin.token))
        .expect(200);
      expect(res.body.total).toBe(4);
      expect(res.body.porDia).toHaveLength(7);
      expect(res.body.porDia.at(-1).cantidad).toBe(4);
      expect(
        res.body.porDia
          .slice(0, -1)
          .every((d: { cantidad: number }) => d.cantidad === 0),
      ).toBe(true);
    });

    it('comentarios por publicación ordena de mayor a menor y excluye las borradas', async () => {
      const res = await api()
        .get('/api/estadisticas/comentarios-por-publicacion')
        .set(como(admin.token))
        .expect(200);
      expect(res.body.datos).toEqual([
        { publicacion: { _id: deAna1, titulo: 'Ana uno' }, cantidad: 3 },
        { publicacion: { _id: deBeto, titulo: 'Beto uno' }, cantidad: 1 },
      ]);
      expect(JSON.stringify(res.body)).not.toContain(deAna2);
    });

    it('un rango que no incluye los datos devuelve todo en cero', async () => {
      const query = {
        desde: '2020-01-01T03:00:00.000Z',
        hasta: '2020-01-31T02:59:59.999Z',
      };
      for (const ruta of [
        'publicaciones-por-usuario',
        'comentarios-por-publicacion',
      ]) {
        const res = await api()
          .get(`/api/estadisticas/${ruta}`)
          .query(query)
          .set(como(admin.token))
          .expect(200);
        expect(res.body.datos).toEqual([]);
      }
      const res = await api()
        .get('/api/estadisticas/comentarios')
        .query(query)
        .set(como(admin.token))
        .expect(200);
      expect(res.body.total).toBe(0);
      expect(res.body.porDia).toHaveLength(30);
      expect(res.body.porDia[0].fecha).toBe('2020-01-01');
    });

    it('cuenta un comentario viejo solo en el rango de su fecha', async () => {
      const modelo = app.get<Model<Comentario>>(getModelToken(Comentario.name));
      await modelo.collection.insertOne({
        publicacion: (await modelo.findOne())!.publicacion,
        autor: (await modelo.findOne())!.autor,
        mensaje: 'Del año pasado',
        modificado: false,
        createdAt: new Date('2025-03-10T15:00:00.000Z'),
        updatedAt: new Date('2025-03-10T15:00:00.000Z'),
      });
      const res = await api()
        .get('/api/estadisticas/comentarios')
        .query({
          desde: '2025-03-01T03:00:00.000Z',
          hasta: '2025-03-31T02:59:59.999Z',
        })
        .set(como(admin.token))
        .expect(200);
      expect(res.body.total).toBe(1);
      expect(
        res.body.porDia.find((d: { fecha: string }) => d.fecha === '2025-03-10')
          .cantidad,
      ).toBe(1);
    });

    it('acepta fechas sin hora e incluye el último día completo', async () => {
      const res = await api()
        .get('/api/estadisticas/comentarios')
        .query({ desde: '2025-03-10', hasta: '2025-03-10' })
        .set(como(admin.token))
        .expect(200);
      expect(res.body.porDia).toEqual([{ fecha: '2025-03-10', cantidad: 1 }]);
    });

    it('valida las fechas del rango', async () => {
      const casos = [
        [{ desde: 'ayer' }, 'La fecha desde no es válida'],
        [{ hasta: '2025-13-45' }, 'La fecha hasta no es válida'],
        [
          { desde: '2025-02-01T00:00:00Z', hasta: '2025-01-01T00:00:00Z' },
          'La fecha desde no puede ser posterior a hasta',
        ],
        [
          { desde: '2023-01-01T00:00:00Z', hasta: '2025-01-01T00:00:00Z' },
          'El rango puede ser de hasta un año',
        ],
      ] as const;
      for (const [query, mensaje] of casos) {
        const res = await api()
          .get('/api/estadisticas/comentarios')
          .query(query)
          .set(como(admin.token))
          .expect(400);
        expect([res.body.message].flat()).toContain(mensaje);
      }
    });
  });

  it('una fecha sin hora abarca el día completo en la hora de Argentina', () => {
    expect(aFecha('2026-03-07', false).toISOString()).toBe(
      '2026-03-07T03:00:00.000Z',
    );
    expect(aFecha('2026-03-07', true).toISOString()).toBe(
      '2026-03-08T02:59:59.999Z',
    );
    expect(aFecha('2026-03-07T10:00:00.000Z', true).toISOString()).toBe(
      '2026-03-07T10:00:00.000Z',
    );
  });

  it('diasEntre arma un día por fecha en la hora de Argentina', () => {
    expect(
      diasEntre({
        desde: new Date('2026-01-01T03:00:00.000Z'),
        hasta: new Date('2026-01-03T02:59:59.999Z'),
      }),
    ).toEqual(['2026-01-01', '2026-01-02']);
  });
});
