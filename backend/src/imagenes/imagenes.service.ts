import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

const CARPETA_RAIZ = 'red-social';

@Injectable()
export class ImagenesService {
  private readonly logger = new Logger(ImagenesService.name);

  constructor(config: ConfigService) {
    const url = new URL(config.getOrThrow<string>('CLOUDINARY_URL'));
    cloudinary.config({
      cloud_name: url.hostname,
      api_key: decodeURIComponent(url.username),
      api_secret: decodeURIComponent(url.password),
      secure: true,
    });
  }

  async subir(archivo: Express.Multer.File, carpeta: string): Promise<string> {
    try {
      const resultado = await new Promise<UploadApiResponse>(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              { folder: `${CARPETA_RAIZ}/${carpeta}`, resource_type: 'image' },
              (error, respuesta) =>
                respuesta ? resolve(respuesta) : reject(error),
            )
            .end(archivo.buffer);
        },
      );
      return resultado.secure_url;
    } catch {
      throw new ServiceUnavailableException(
        'No se pudo guardar la imagen. Intentá de nuevo en unos minutos.',
      );
    }
  }

  async eliminar(url: string | null | undefined): Promise<void> {
    const publicId = url ? idPublico(url) : null;
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (error) {
      this.logger.warn(`No se pudo borrar ${publicId}: ${String(error)}`);
    }
  }
}

export function idPublico(url: string): string | null {
  const coincidencia = new RegExp(
    String.raw`/upload/(?:v\d+/)?(${CARPETA_RAIZ}/.+)\.[a-z0-9]+$`,
    'i',
  ).exec(url);
  return coincidencia ? coincidencia[1] : null;
}
