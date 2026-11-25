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
    expect(pipe.transform(hace(4 * 86_400_000), ahora)).toBe('hace 4 días');
  });

  it('después de una semana muestra la fecha, con el año si no es el actual', () => {
    expect(pipe.transform(new Date(2026, 9, 3, 10), ahora)).toMatch(/^3 oct/);
    expect(pipe.transform(new Date(2025, 2, 10, 10), ahora)).toMatch(/^10 mar.* 2025$/);
  });

  it('devuelve vacío para valores nulos o inválidos', () => {
    expect(pipe.transform(null, ahora)).toBe('');
    expect(pipe.transform('no es fecha', ahora)).toBe('');
  });
});

describe('PluralPipe', () => {
  const pipe = new PluralPipe();

  it('usa singular solo para uno', () => {
    expect(pipe.transform(1, 'comentario')).toBe('1 comentario');
    expect(pipe.transform(0, 'comentario')).toBe('0 comentarios');
    expect(pipe.transform(7, 'comentario')).toBe('7 comentarios');
  });

  it('acepta un plural irregular y trata null como cero', () => {
    expect(pipe.transform(2, 'publicación', 'publicaciones')).toBe('2 publicaciones');
    expect(pipe.transform(null, 'usuario')).toBe('0 usuarios');
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
