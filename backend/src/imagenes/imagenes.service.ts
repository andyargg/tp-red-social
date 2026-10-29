import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

const CARPETA_RAIZ = 'red-social';

@Injectable()
export class ImagenesService {
  constructor(config: ConfigService) {
    // CLOUDINARY_URL tiene la forma cloudinary://<api_key>:<api_secret>@<cloud_name>
    const url = new URL(config.getOrThrow<string>('CLOUDINARY_URL'));
    cloudinary.config({
      cloud_name: url.hostname,
      api_key: decodeURIComponent(url.username),
      api_secret: decodeURIComponent(url.password),
      secure: true,
    });
  }

  // sube la imagen a red-social/<carpeta> y devuelve su URL pública (https)
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
}
