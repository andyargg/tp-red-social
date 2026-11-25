import { formatDate } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { RelojService } from './reloj.service';

const MINUTO = 60_000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

@Pipe({ name: 'tiempoRelativo', pure: false })
export class TiempoRelativoPipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);
  private readonly reloj = inject(RelojService);

  transform(fecha: string | Date | null | undefined, ahora: Date = this.reloj.ahora()): string {
    if (!fecha) return '';
    const momento = new Date(fecha);
    if (Number.isNaN(momento.getTime())) return '';
    const pasado = ahora.getTime() - momento.getTime();

    if (pasado < MINUTO) return 'recién';
    if (pasado < HORA) return `hace ${Math.floor(pasado / MINUTO)} min`;
    if (pasado < DIA) return `hace ${Math.floor(pasado / HORA)} h`;
    if (pasado < 2 * DIA) return 'ayer';
    if (pasado < 7 * DIA) return `hace ${Math.floor(pasado / DIA)} días`;
    const formato = momento.getFullYear() === ahora.getFullYear() ? 'd MMM' : 'd MMM y';
    return formatDate(momento, formato, this.locale);
  }
}
