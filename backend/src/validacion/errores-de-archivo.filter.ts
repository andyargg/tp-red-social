import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  HttpException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { TAMANIO_MAXIMO } from '../imagenes/opciones-imagen.js';

@Catch(PayloadTooLargeException, BadRequestException)
export class ErroresDeArchivoFilter extends BaseExceptionFilter {
  catch(error: HttpException, host: ArgumentsHost) {
    if (error instanceof PayloadTooLargeException) {
      const mb = TAMANIO_MAXIMO / 1024 / 1024;
      error = new PayloadTooLargeException(
        `La imagen puede pesar hasta ${mb} MB`,
      );
    } else if (error.message === 'Unexpected field') {
      error = new BadRequestException(
        'Se envió un archivo en un campo que no lo acepta',
      );
    }
    super.catch(error, host);
  }
}
