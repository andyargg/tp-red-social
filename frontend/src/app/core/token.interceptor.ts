import {
  HttpErrorResponse,
  HttpHeaders,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ModalService } from '../shared/modal/modal.service';
import { AuthService } from './auth.service';
import { mensajeDeError } from './errores';

const RUTAS_DE_SESION = `${environment.apiUrl}/auth/`;
const PRECISION_DEL_ENCABEZADO = 500;
const SIN_REDIRECCION = [`${environment.apiUrl}/auth/login`, `${environment.apiUrl}/auth/registro`];

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const modal = inject(ModalService);

  const token = auth.token();
  const aLaApi = req.url.startsWith(environment.apiUrl);
  const pedido =
    token && aLaApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  const enviado = Date.now();
  const tomarHora = (encabezados: HttpHeaders) => {
    const hora = req.url.startsWith(RUTAS_DE_SESION) ? encabezados.get('Date') : null;
    if (!hora) return;
    const recibido = Date.now();
    auth.registrarHoraDelServidor(
      Date.parse(hora) + PRECISION_DEL_ENCABEZADO,
      (enviado + recibido) / 2,
    );
  };

  return next(pedido).pipe(
    tap((evento) => {
      if (evento instanceof HttpResponse) tomarHora(evento.headers);
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) tomarHora(error.headers);
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        aLaApi &&
        !SIN_REDIRECCION.includes(req.url) &&
        token !== null &&
        auth.token() === token
      ) {
        auth.cerrarSesion();
        router.navigateByUrl('/login').then(() =>
          modal.abrir({
            tipo: 'info',
            titulo: 'Tu sesión terminó',
            mensaje: mensajeDeError(error),
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
