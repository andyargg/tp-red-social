import { formatDate } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';

const MINUTO = 60_000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

function inicioDelDia(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime();
}

@Pipe({ name: 'tiempoRelativo' })
export class TiempoRelativoPipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(fecha: string | Date | null | undefined, ahora: Date = new Date()): string {
    if (!fecha) return '';
    const momento = new Date(fecha);
    if (Number.isNaN(momento.getTime())) return '';
    const pasado = ahora.getTime() - momento.getTime();

    if (pasado >= -MINUTO) {
      if (pasado < MINUTO) return 'recién';
      if (pasado < HORA) return `hace ${Math.floor(pasado / MINUTO)} min`;
      if (pasado < DIA) return `hace ${Math.floor(pasado / HORA)} h`;
      const dias = Math.round((inicioDelDia(ahora) - inicioDelDia(momento)) / DIA);
      if (dias <= 1) return 'ayer';
      if (dias < 7) return `hace ${dias} días`;
    }
    const formato = momento.getFullYear() === ahora.getFullYear() ? 'd MMM' : 'd MMM y';
    return formatDate(momento, formato, this.locale);
  }
}
