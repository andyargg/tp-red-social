import { Routes } from '@angular/router';
import { Shell } from './layout/shell';

// sprint 1: navegación libre, sin guards
export const routes: Routes = [
  {
    path: 'login',
    title: 'Ingresar · Socialito',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    title: 'Crear cuenta · Socialito',
    loadComponent: () => import('./pages/registro/registro').then((m) => m.Registro),
  },
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'publicaciones' },
      {
        path: 'publicaciones',
        title: 'Publicaciones · Socialito',
        loadComponent: () =>
          import('./pages/publicaciones/publicaciones').then((m) => m.Publicaciones),
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
