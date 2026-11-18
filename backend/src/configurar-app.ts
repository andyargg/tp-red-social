import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ErroresDeArchivoFilter } from './validacion/errores-de-archivo.filter.js';

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
