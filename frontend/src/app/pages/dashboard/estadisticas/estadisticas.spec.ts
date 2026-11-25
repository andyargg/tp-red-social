import { COLOR_OTROS, agruparPorciones } from '../../../shared/grafico';
import { problemaDeRango, ultimosDias } from './selector-rango';

describe('rango de fechas de las estadísticas', () => {
  it('ultimosDias incluye el día de hoy', () => {
    expect(ultimosDias(7, new Date(2026, 10, 25, 15))).toEqual({
      desde: '2026-11-19',
      hasta: '2026-11-25',
    });
    expect(ultimosDias(1, new Date(2026, 0, 1))).toEqual({
      desde: '2026-01-01',
      hasta: '2026-01-01',
    });
  });

  it('valida el orden y el largo del rango', () => {
    expect(problemaDeRango({ desde: '2026-01-01', hasta: '2026-01-31' })).toBeNull();
    expect(problemaDeRango({ desde: '2026-02-01', hasta: '2026-01-01' })).toBe(
      'La fecha desde no puede ser posterior a hasta.',
    );
    expect(problemaDeRango({ desde: '2024-01-01', hasta: '2025-06-01' })).toBe(
      'El rango puede ser de hasta un año.',
    );
    expect(problemaDeRango({ desde: '', hasta: '2025-06-01' })).toBe('Elegí las dos fechas.');
  });
});

describe('agruparPorciones', () => {
  it('deja hasta seis porciones con colores fijos', () => {
    const porciones = agruparPorciones(['a', 'b', 'c'], [5, 3, 1]);
    expect(porciones.map((p) => p.etiqueta)).toEqual(['a', 'b', 'c']);
    expect(new Set(porciones.map((p) => p.color)).size).toBe(3);
  });

  it('junta el resto en "Otros" cuando hay más de seis, sin repetir colores', () => {
    const etiquetas = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const porciones = agruparPorciones(etiquetas, [9, 8, 7, 6, 5, 4, 3]);
    expect(porciones).toHaveLength(6);
    expect(porciones.at(-1)).toEqual({ etiqueta: 'Otros (2)', valor: 7, color: COLOR_OTROS });
    expect(porciones.every((p) => p.color)).toBe(true);
    expect(new Set(porciones.map((p) => p.color)).size).toBe(6);
  });
});
