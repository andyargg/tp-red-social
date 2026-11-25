import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { adminGuard, invitadoGuard, sesionGuard } from './guards';
import { vencimiento } from './jwt';

function token(exp: number) {
  const payload = btoa(JSON.stringify({ sub: '1', exp })).replace(/=+$/, '');
  return `cabecera.${payload}.firma`;
}

describe('guards de sesión', () => {
  const ruta = {} as ActivatedRouteSnapshot;
  const estado = { url: '/mi-perfil' } as RouterStateSnapshot;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  const correr = (guard: typeof sesionGuard) =>
    TestBed.runInInjectionContext(() => guard(ruta, estado)) as boolean | UrlTree;

  it('sin sesión validada, las pantallas internas pasan por cargando con el destino', () => {
    const resultado = correr(sesionGuard) as UrlTree;
    expect(resultado.toString()).toBe('/cargando?destino=%2Fmi-perfil');
  });

  it('con la sesión validada deja pasar a las pantallas internas y no al login', () => {
    TestBed.inject(AuthService).login('ana', 'Secreta123').subscribe();
    TestBed.inject(HttpTestingController)
      .expectOne((req) => req.url.endsWith('/auth/login'))
      .flush({ usuario: { _id: '1' }, token: 'abc' });

    expect(correr(sesionGuard)).toBe(true);
    expect((correr(invitadoGuard) as UrlTree).toString()).toBe('/publicaciones');
  });

  it('el login queda libre sin token y manda a validar si hay uno guardado', () => {
    expect(correr(invitadoGuard)).toBe(true);
    localStorage.setItem('token', 'guardado');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
    expect((correr(invitadoGuard) as UrlTree).toString()).toBe('/cargando');
  });

  it('el dashboard solo deja pasar a administradores', () => {
    const ingresar = (perfil: string) => {
      TestBed.inject(AuthService).login('ana', 'Secreta123').subscribe();
      TestBed.inject(HttpTestingController)
        .expectOne((req) => req.url.endsWith('/auth/login'))
        .flush({ usuario: { _id: '1', perfil }, token: 'abc' });
    };
    expect((correr(adminGuard) as UrlTree).toString()).toBe('/publicaciones');
    ingresar('usuario');
    expect((correr(adminGuard) as UrlTree).toString()).toBe('/publicaciones');
    ingresar('administrador');
    expect(correr(adminGuard)).toBe(true);
  });
});

describe('vencimiento del token', () => {
  it('lee el campo exp del payload en milisegundos', () => {
    expect(vencimiento(token(1_700_000_000))).toBe(1_700_000_000_000);
  });

  it('devuelve null si el token no tiene el formato esperado', () => {
    expect(vencimiento('no-es-un-jwt')).toBeNull();
    expect(vencimiento(`a.${btoa('{}')}.c`)).toBeNull();
  });
});
