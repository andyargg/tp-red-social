import { Routes } from '@angular/router';
import { invitadoGuard, sesionGuard } from './core/guards';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: 'cargando',
    title: 'Cargando · Socialito',
    loadComponent: () => import('./pages/cargando/cargando').then((m) => m.Cargando),
  },
  {
    path: 'login',
    title: 'Ingresar · Socialito',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    title: 'Crear cuenta · Socialito',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./pages/registro/registro').then((m) => m.Registro),
  },
  {
    path: '',
    component: Shell,
    canActivate: [sesionGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'publicaciones' },
      {
        path: 'publicaciones',
        title: 'Publicaciones · Socialito',
        loadComponent: () =>
          import('./pages/publicaciones/publicaciones').then((m) => m.Publicaciones),
      },
      {
        path: 'publicaciones/:id',
        title: 'Publicación · Socialito',
        loadComponent: () =>
          import('./pages/publicacion/publicacion-detalle').then((m) => m.PublicacionDetalle),
      },
      {
        path: 'mi-perfil',
        title: 'Mi perfil · Socialito',
        loadComponent: () => import('./pages/mi-perfil/mi-perfil').then((m) => m.MiPerfil),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
