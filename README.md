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

Las dos rutas devuelven `{ usuario, token }`. El token es un JWT que vence a los 15 minutos.
