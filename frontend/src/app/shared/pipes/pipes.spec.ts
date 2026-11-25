import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NombreCompletoPipe } from './nombre-completo.pipe';
import { PluralPipe } from './plural.pipe';
import { TiempoRelativoPipe } from './tiempo-relativo.pipe';

registerLocaleData(localeEsAr);

describe('TiempoRelativoPipe', () => {
  const ahora = new Date(2026, 10, 25, 12, 0, 0);
  let pipe: TiempoRelativoPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'es-AR' }] });
    pipe = TestBed.runInInjectionContext(() => new TiempoRelativoPipe());
  });

  const hace = (ms: number) => new Date(ahora.getTime() - ms).toISOString();

  it('describe cuánto pasó en palabras', () => {
    expect(pipe.transform(hace(20_000), ahora)).toBe('recién');
    expect(pipe.transform(hace(5 * 60_000), ahora)).toBe('hace 5 min');
    expect(pipe.transform(hace(3 * 3_600_000), ahora)).toBe('hace 3 h');
    expect(pipe.transform(hace(30 * 3_600_000), ahora)).toBe('ayer');
    expect(pipe.transform(new Date(2026, 10, 23, 23, 0), ahora)).toBe('hace 2 días');
    expect(pipe.transform(new Date(2026, 10, 24, 23, 30), ahora)).toBe('hace 12 h');
    expect(pipe.transform(hace(4 * 86_400_000), ahora)).toBe('hace 4 días');
  });

  it('después de una semana muestra la fecha, con el año si no es el actual', () => {
    expect(pipe.transform(new Date(2026, 9, 3, 10), ahora)).toMatch(/^3 oct/);
    expect(pipe.transform(new Date(2025, 2, 10, 10), ahora)).toMatch(/^10 mar.* 2025$/);
  });

  it('una fecha muy en el futuro se muestra como fecha y no como recién', () => {
    expect(pipe.transform(new Date(2026, 10, 27, 12), ahora)).toMatch(/^27 nov/);
    expect(pipe.transform(new Date(ahora.getTime() + 20_000), ahora)).toBe('recién');
  });

  it('devuelve vacío para valores nulos o inválidos', () => {
    expect(pipe.transform(null, ahora)).toBe('');
    expect(pipe.transform('no es fecha', ahora)).toBe('');
  });
});

describe('PluralPipe', () => {
  const pipe = new PluralPipe();

  it('elige la forma singular solo para uno', () => {
    expect(pipe.transform(1, 'comentario')).toBe('comentario');
    expect(pipe.transform(0, 'comentario')).toBe('comentarios');
    expect(pipe.transform(7, 'comentario')).toBe('comentarios');
  });

  it('acepta un plural irregular y trata null como cero', () => {
    expect(pipe.transform(2, 'publicación', 'publicaciones')).toBe('publicaciones');
    expect(pipe.transform(null, 'usuario')).toBe('usuarios');
  });
});

describe('NombreCompletoPipe', () => {
  const pipe = new NombreCompletoPipe();

  it('une nombre y apellido sin espacios sobrantes', () => {
    expect(pipe.transform({ nombre: ' Lucía ', apellido: 'Fernández' })).toBe('Lucía Fernández');
    expect(pipe.transform({ nombre: 'Ana', apellido: '' })).toBe('Ana');
    expect(pipe.transform(null)).toBe('');
  });
});
