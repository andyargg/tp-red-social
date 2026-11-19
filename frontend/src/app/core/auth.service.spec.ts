import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

function token(sub: string, exp = 2_000_000_000) {
  const payload = btoa(JSON.stringify({ sub, exp })).replace(/=+$/, '');
  return `cabecera.${payload}.firma`;
}

describe('AuthService.sincronizar (cambios desde otra pestaña)', () => {
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    auth.login('ana', 'Secreta123').subscribe();
    TestBed.inject(HttpTestingController)
      .expectOne((req) => req.url.endsWith('/auth/login'))
      .flush({ usuario: { _id: 'ana' }, token: token('ana') });
  });

  it('un refresco del mismo usuario mantiene la sesión validada', () => {
    const nuevo = token('ana', 2_000_000_900);
    localStorage.setItem('token', nuevo);
    expect(auth.sincronizar('token')).toBe('actualizada');
    expect(auth.token()).toBe(nuevo);
    expect(auth.verificada()).toBe(true);
    expect(auth.usuario()?._id).toBe('ana');
  });

  it('solo guarda el token en el navegador', () => {
    expect(localStorage.getItem('token')).not.toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();
  });

  it('un token de otro usuario obliga a validarlo de nuevo', () => {
    localStorage.setItem('token', token('beto'));
    expect(auth.sincronizar('token')).toBe('otroUsuario');
    expect(auth.verificada()).toBe(false);
    expect(auth.usuario()).toBeNull();
  });

  it('cerrar sesión en otra pestaña la cierra en esta', () => {
    localStorage.clear();
    expect(auth.sincronizar(null)).toBe('cerrada');
    expect(auth.token()).toBeNull();
    expect(auth.usuario()).toBeNull();
    expect(auth.verificada()).toBe(false);
  });

  it('ignora cambios de otras claves', () => {
    localStorage.setItem('usuario', '{}');
    expect(auth.sincronizar('usuario')).toBe('ninguno');
    expect(auth.verificada()).toBe(true);
  });
});
