# Socialito — TP #2 Red social

Programación IV · UTN Avellaneda · 2026 C1

- **Frontend:** https://andyargg.github.io/tp-red-social/ (GitHub Pages)
- **Backend:** https://tp-red-social-api.onrender.com/api (Render)

| Carpeta | Stack |
|---|---|
| `frontend/` | Angular 22 |
| `backend/` | NestJS 12 + MongoDB (Mongoose) + JWT |

## Cómo correrlo

### Backend

```bash
cd backend
cp .env.example .env   # completar MONGODB_URI y JWT_SECRET
npm install
npm run start:dev      # http://localhost:3000/api
```

### Frontend

```bash
cd frontend
npm install
npm start              # http://localhost:4200
```

## Usuario administrador

Por defecto todo usuario nuevo tiene perfil `usuario`. Un administrador puede crear otros administradores desde **Administración → Usuarios** en la app. Para crear el primero, desde `backend/` (usa la base configurada en `.env`):

```bash
# convertir en administrador a un usuario que ya existe
npm run crear-admin -- <nombre de usuario o correo>

# crear un administrador nuevo
npm run crear-admin -- --nombre Ana --apellido García --correo ana@mail.com   --usuario ana.admin --password Admin1234 --nacimiento 1995-04-20
```

## Deploy

- **Frontend:** cada push a `main` que toca `frontend/` lo compila y publica en GitHub Pages (`.github/workflows/deploy-frontend.yml`).
- **Backend:** Render lo despliega a partir de `render.yaml`. Las variables `MONGODB_URI` y `CLOUDINARY_URL` se cargan en el panel de Render y `JWT_SECRET` se genera solo.

En el plan gratuito, Render apaga el backend después de 15 minutos sin uso, y la primera petición tarda alrededor de un minuto.

## Tests

```bash
cd backend && npm run test:e2e   # usa un MongoDB en memoria, no hace falta tener Mongo instalado
cd frontend && npx ng test --watch=false
```

## API

| Método | Ruta | Descripción | Respuestas |
|---|---|---|---|
| POST | `/api/auth/registro` | `multipart/form-data` con nombre, apellido, correo, nombreUsuario, password, fechaNacimiento, descripcion e `imagenPerfil` (opcional) | 201, 400, 409 |
| POST | `/api/auth/login` | `{ usuario, password }`: `usuario` acepta el correo o el nombre de usuario | 200, 400, 401, 403 |
| POST | `/api/auth/autorizar` | Valida el token y devuelve los datos actuales del usuario | 200, 401 |
| POST | `/api/auth/refrescar` | Con un token válido devuelve `{ token }`: el mismo payload y 2 minutos más | 200, 401 |
| PATCH | `/api/usuarios/yo` | `multipart/form-data` con los campos a cambiar (nombre, apellido, fechaNacimiento, descripcion), `imagenPerfil` (opcional) o `quitarImagen=true`. El correo y el nombre de usuario no cambian | 200, 400, 401 |
| POST | `/api/publicaciones` | `multipart/form-data` con titulo, mensaje e `imagen` (opcional) | 201, 400, 401 |
| GET | `/api/publicaciones` | Query: `orden` (`fecha` o `meGusta`), `usuario` (id del autor), `offset`, `limit` (máx. 50). Devuelve `{ publicaciones, total, offset, limit }` | 200, 400, 401 |
| GET | `/api/publicaciones/:id` | Una publicación con su autor y contadores | 200, 400, 401, 404 |
| DELETE | `/api/publicaciones/:id` | Baja lógica. Solo el autor o un administrador | 204, 401, 403, 404 |
| POST | `/api/publicaciones/:id/me-gusta` | Da me gusta (uno por usuario) | 201, 401, 404, 409 |
| DELETE | `/api/publicaciones/:id/me-gusta` | Quita el me gusta, solo si se había dado | 200, 401, 404, 409 |
| GET | `/api/publicaciones/:id/comentarios` | Query: `offset`, `limit`. Los más recientes primero | 200, 400, 401, 404 |
| POST | `/api/publicaciones/:id/comentarios` | `{ mensaje }` (hasta 500 caracteres). Guarda el autor y la fecha | 201, 400, 401, 404 |
| PUT | `/api/publicaciones/:id/comentarios/:comentarioId` | `{ mensaje }`. Solo el autor; marca `modificado: true` | 200, 400, 401, 403, 404 |
| GET | `/api/usuarios` | Solo administradores. Lista todos los usuarios, los más nuevos primero | 200, 401, 403 |
| POST | `/api/usuarios` | Solo administradores. Igual que el registro más `perfil` (`usuario` o `administrador`). Devuelve el usuario creado, sin token | 201, 400, 401, 403, 409 |
| DELETE | `/api/usuarios/:id` | Solo administradores. Baja lógica: el usuario no puede ingresar y su token deja de servir. Un administrador no puede deshabilitarse a sí mismo | 200, 400, 401, 403, 404 |
| POST | `/api/usuarios/:id/habilitar` | Solo administradores. Alta lógica: vuelve a habilitar al usuario | 200, 400, 401, 403, 404 |
| GET | `/api/estadisticas/publicaciones-por-usuario` | Solo administradores. Query: `desde`, `hasta` (fechas ISO, por defecto los últimos 30 días, hasta un año). Devuelve `{ desde, hasta, datos: [{ usuario, cantidad }] }` | 200, 400, 401, 403 |
| GET | `/api/estadisticas/comentarios` | Solo administradores. Mismo rango. Devuelve `{ desde, hasta, total, porDia: [{ fecha, cantidad }] }` con todos los días del rango (hora de Argentina) | 200, 400, 401, 403 |
| GET | `/api/estadisticas/comentarios-por-publicacion` | Solo administradores. Mismo rango. Devuelve `{ desde, hasta, datos: [{ publicacion, cantidad }] }` | 200, 400, 401, 403 |

Registro y login devuelven `{ usuario, token }`. El token es un JWT que vence a los 2 minutos. Las demás rutas (salvo registro y login) exigen el header `Authorization: Bearer <token>` de un usuario habilitado.

Las publicaciones dadas de baja y sus comentarios no se cuentan en las estadísticas.

## Frontend

- **Administración** (solo administradores): `dashboard/usuarios` para listar, crear, deshabilitar y habilitar usuarios, y `dashboard/estadisticas` con un gráfico de torta, uno de líneas y uno de barras, cada uno con su propio rango de fechas.
- **PWA:** se puede instalar desde el navegador. El service worker solo se activa en el build de producción.
- **Pipes propios:** `tiempoRelativo` ("hace 5 min"), `plural` (elige "comentario" o "comentarios" según la cantidad) y `nombreCompleto`.
- **Directivas propias:** `appAutofoco` (enfoca un campo al aparecer), `appImagenRespaldo` (oculta o reemplaza una imagen que no carga) y `*appSoloAdmin` (muestra algo solo a administradores).

## Créditos

Los íconos son de [Lucide](https://lucide.dev) (licencia ISC). Los gráficos usan [Chart.js](https://www.chartjs.org) (licencia MIT).
