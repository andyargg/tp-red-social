import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const sesionGuard: CanActivateFn = (_ruta, estado) => {
  const auth = inject(AuthService);
  if (auth.token() && auth.verificada()) return true;
  return inject(Router).createUrlTree(['/cargando'], { queryParams: { destino: estado.url } });
};

export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.token()) return true;
  return router.createUrlTree([auth.verificada() ? '/publicaciones' : '/cargando']);
};
