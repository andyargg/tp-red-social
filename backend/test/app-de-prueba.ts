import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/configurar-app.js';
import { ImagenesService } from '../src/imagenes/imagenes.service.js';

export const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

export function crearImagenesFalso() {
  return {
    subidas: [] as { carpeta: string; tamanio: number }[],
    eliminadas: [] as string[],
    async eliminar(url: string | null | undefined) {
      if (url) this.eliminadas.push(url);
    },
    async subir(archivo: Express.Multer.File, carpeta: string) {
      this.subidas.push({ carpeta, tamanio: archivo.size });
      const n = this.subidas.length;
      return `https://res.cloudinary.com/test/image/upload/red-social/${carpeta}/foto${n}.png`;
    },
  };
}

export async function crearAppDePrueba(
  imagenes: ReturnType<typeof crearImagenesFalso>,
) {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = 'secreto-de-test';

  const modulo = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ImagenesService)
    .useValue(imagenes)
    .compile();
  const app = modulo.createNestApplication<NestExpressApplication>();
  configurarApp(app);
  await app.init();

  return {
    app,
    async cerrar() {
      await app.close();
      await mongo.stop();
    },
  };
}
