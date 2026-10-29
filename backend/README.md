# Backend — Red social

API en NestJS con MongoDB. Ver el [README principal](../README.md) para correrlo y la lista de rutas.

## Variables de entorno

Copiar `.env.example` a `.env`:

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (por defecto 3000) |
| `MONGODB_URI` | Conexión a MongoDB (por ejemplo, MongoDB Atlas) |
| `JWT_SECRET` | Secreto para firmar los tokens |
| `PUBLIC_URL` | URL pública del backend, para armar los links de las imágenes |
| `FRONTEND_URL` | Orígenes permitidos por CORS, separados por coma |

## Módulos

- `auth`: registro y login.
- `usuarios`: modelo y acceso a los usuarios.
- `publicaciones`: modelo de publicaciones (las rutas llegan en el sprint 2).

Las imágenes subidas se guardan en `uploads/` y se sirven en `/uploads`.
