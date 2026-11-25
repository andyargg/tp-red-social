import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/auth.service';
import { AutofocoDirective } from './autofoco.directive';
import { ImagenRespaldoDirective } from './imagen-respaldo.directive';
import { SoloAdminDirective } from './solo-admin.directive';

@Component({
  imports: [AutofocoDirective, ImagenRespaldoDirective, SoloAdminDirective],
  template: `
    <input id="primero" />
    <input id="enfocado" appAutofoco value="hola" />
    <img id="conRespaldo" [appImagenRespaldo]="respaldo" src="rota.png" alt="" />
    <img
      id="sinRespaldo"
      appImagenRespaldo
      src="rota.png"
      alt=""
      (imagenRota)="rotas.set(rotas() + 1)"
    />
    <p *appSoloAdmin id="admin">Solo admin</p>
  `,
})
class Prueba {
  readonly respaldo = 'respaldo.png';
  readonly rotas = signal(0);
}

function token(sub: string) {
  return `cabecera.${btoa(JSON.stringify({ sub, exp: 2_000_000_000 })).replace(/=+$/, '')}.firma`;
}

describe('directivas propias', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  function iniciarSesion(perfil: 'usuario' | 'administrador') {
    TestBed.inject(AuthService).login('ana', 'Secreta123').subscribe();
    TestBed.inject(HttpTestingController)
      .expectOne((req) => req.url.endsWith('/auth/login'))
      .flush({ usuario: { _id: 'ana', perfil }, token: token('ana') });
  }

  it('appAutofoco enfoca el campo al mostrarse', async () => {
    const fixture = TestBed.createComponent(Prueba);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    await Promise.resolve();
    expect(document.activeElement?.id).toBe('enfocado');
    fixture.nativeElement.remove();
  });

  it('appImagenRespaldo cambia a la imagen de respaldo o oculta la imagen rota', () => {
    const fixture = TestBed.createComponent(Prueba);
    fixture.detectChanges();
    const conRespaldo: HTMLImageElement = fixture.nativeElement.querySelector('#conRespaldo');
    const sinRespaldo: HTMLImageElement = fixture.nativeElement.querySelector('#sinRespaldo');

    conRespaldo.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(conRespaldo.getAttribute('src')).toBe('respaldo.png');
    expect(conRespaldo.style.display).toBe('');

    sinRespaldo.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(sinRespaldo.style.display).toBe('none');
    expect(fixture.componentInstance.rotas()).toBe(1);

    sinRespaldo.dispatchEvent(new Event('load'));
    fixture.detectChanges();
    expect(sinRespaldo.style.display).toBe('');
  });

  it('appSoloAdmin muestra el contenido solo a administradores y reacciona al cambio de sesión', () => {
    iniciarSesion('usuario');
    const fixture = TestBed.createComponent(Prueba);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#admin')).toBeNull();

    TestBed.inject(AuthService).cerrarSesion();
    iniciarSesion('administrador');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#admin')?.textContent).toBe('Solo admin');

    TestBed.inject(AuthService).cerrarSesion();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#admin')).toBeNull();
  });
});
