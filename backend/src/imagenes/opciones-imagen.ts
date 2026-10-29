import { BadRequestException } from '@nestjs/common';

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const TAMANIO_MAXIMO = 5 * 1024 * 1024;

// opciones de multer: el archivo queda en memoria hasta validar el body, así una petición
// rechazada nunca llega a subir la imagen a Cloudinary
export const opcionesImagen = {
  limits: { fileSize: TAMANIO_MAXIMO },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, aceptar: boolean) => void,
  ) => {
    if (TIPOS_PERMITIDOS.includes(file.mimetype)) return callback(null, true);
    callback(
      new BadRequestException('La imagen debe ser JPG, PNG, WEBP o GIF'),
      false,
    );
  },
};
