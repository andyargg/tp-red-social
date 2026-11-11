import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ErroresDeArchivoFilter } from './validacion/errores-de-archivo.filter.js';

// lo usan main.ts y los tests e2e, así los dos corren con los mismos pipes y prefijo
export function configurarApp(app: NestExpressApplication) {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
    }),
  );
  app.useGlobalFilters(new ErroresDeArchivoFilter(app.getHttpAdapter()));
  app.enableCors({ origin: process.env.FRONTEND_URL?.split(',') ?? true });
}
