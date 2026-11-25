# Backend — Socialito

API en NestJS con MongoDB. Ver el [README principal](../README.md) para correrlo y la lista de rutas.

## Variables de entorno

Copiar `.env.example` a `.env`:

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (por defecto 3000) |
| `MONGODB_URI` | Conexión a MongoDB (por ejemplo, MongoDB Atlas) |
| `JWT_SECRET` | Secreto para firmar los tokens |
| `CLOUDINARY_URL` | Credenciales de Cloudinary: `cloudinary://<api_key>:<api_secret>@<cloud_name>` |
| `FRONTEND_URL` | Orígenes permitidos por CORS, separados por coma |

## Módulos

- `auth`: registro, login, autorizar y refrescar el token, `JwtGuard`, que protege las rutas con el token, y `AdminGuard`, que además exige perfil de administrador.
- `usuarios`: modelo de usuarios, edición del perfil propio (`PATCH /usuarios/yo`) y, para administradores, listado, alta y bajas y altas lógicas de usuarios.
- `publicaciones`: alta, detalle, listado paginado, baja lógica y me gusta de publicaciones (`PublicacionesController`); listado, alta y edición de comentarios (`ComentariosController`); estadísticas para los gráficos del dashboard (`EstadisticasController`, solo administradores).
- `imagenes`: subida de imágenes a Cloudinary (carpeta `red-social/`).
