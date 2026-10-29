import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { UPLOADS_DIR } from './common/imagenes.js';

// lo usan main.ts y los tests e2e, así los dos corren con los mismos pipes y prefijo
export function configurarApp(app: NestExpressApplication) {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: process.env.FRONTEND_URL?.split(',') ?? true });
  app.useStaticAssets(UPLOADS_DIR, { prefix: '/uploads' });
}
