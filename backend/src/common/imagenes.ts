import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const TAMANIO_MAXIMO = 5 * 1024 * 1024;

// opciones de multer: el archivo queda en memoria hasta validar el body, así una petición
// rechazada no deja imágenes huérfanas en disco
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

// guarda la imagen en uploads/<carpeta> y devuelve su URL pública
export async function guardarImagen(
  archivo: Express.Multer.File,
  carpeta: string,
  urlPublica: string,
): Promise<string> {
  const nombre = `${randomUUID()}${extname(archivo.originalname).toLowerCase()}`;
  const directorio = join(UPLOADS_DIR, carpeta);
  await mkdir(directorio, { recursive: true });
  await writeFile(join(directorio, nombre), archivo.buffer);
  return `${urlPublica}/uploads/${carpeta}/${nombre}`;
}
