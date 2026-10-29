# TP #2 — Red social

Programación IV · UTN Avellaneda · 2026 C1

**Frontend publicado:** https://andyargg.github.io/tp-red-social/

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
