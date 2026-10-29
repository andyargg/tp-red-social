import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ModalService } from '../shared/modal/modal.service';
import { AuthService } from './auth.service';
import { mensajeDeError } from './errores';

// agrega el token a las peticiones a la API; si vence, manda a ingresar de nuevo
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const modal = inject(ModalService);

  const token = auth.token;
  const aLaApi = req.url.startsWith(environment.apiUrl);
  const pedido =
    token && aLaApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(pedido).pipe(
    catchError((error: unknown) => {
      // el login con datos incorrectos también da 401, pero ese error lo maneja su pantalla
      const esLogin = req.url.startsWith(`${environment.apiUrl}/auth`);
      if (error instanceof HttpErrorResponse && error.status === 401 && aLaApi && !esLogin) {
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
