# TP #2 — Red social

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

Por defecto todo usuario nuevo tiene perfil `usuario`. Para tener un administrador, desde `backend/` (usa la base configurada en `.env`):

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

| POST | `/api/publicaciones` | `multipart/form-data` con titulo, mensaje e `imagen` (opcional) | 201, 400, 401 |
| GET | `/api/publicaciones` | Query: `orden` (`fecha` o `meGusta`), `usuario` (id del autor), `offset`, `limit` (máx. 50). Devuelve `{ publicaciones, total, offset, limit }` | 200, 400, 401 |
| DELETE | `/api/publicaciones/:id` | Baja lógica. Solo el autor o un administrador | 204, 401, 403, 404 |
| POST | `/api/publicaciones/:id/me-gusta` | Da me gusta (uno por usuario) | 201, 401, 404, 409 |
| DELETE | `/api/publicaciones/:id/me-gusta` | Quita el me gusta, solo si se había dado | 200, 401, 404, 409 |
| GET | `/api/publicaciones/:id/comentarios` | Query: `offset`, `limit`. Los más recientes primero | 200, 400, 401, 404 |

Las rutas de auth devuelven `{ usuario, token }`. El token es un JWT que vence a los 15 minutos. Las rutas de publicaciones exigen el header `Authorization: Bearer <token>` de un usuario habilitado.
