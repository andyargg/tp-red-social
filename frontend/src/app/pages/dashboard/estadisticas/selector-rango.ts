import { Component, computed, inject, model, signal } from '@angular/core';
import { RangoFechas } from '../../../core/estadisticas.service';
import { RelojService } from '../../../shared/pipes/reloj.service';

const DIA = 24 * 60 * 60 * 1000;
const MAXIMO_DIAS = 366;

export const ATAJOS = [
  { dias: 7, texto: '7 días' },
  { dias: 30, texto: '30 días' },
  { dias: 90, texto: '3 meses' },
  { dias: 365, texto: '1 año' },
] as const;

const formatoArgentina = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Buenos_Aires',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function fechaArgentina(fecha: Date): string {
  return formatoArgentina.format(fecha);
}

export function ultimosDias(dias: number, ahora = new Date()): RangoFechas {
  const hasta = fechaArgentina(ahora);
  const [anio, mes, dia] = hasta.split('-').map(Number);
  const desde = new Date(Date.UTC(anio, mes - 1, dia - (dias - 1))).toISOString().slice(0, 10);
  return { desde, hasta };
}

export function problemaDeRango({ desde, hasta }: RangoFechas): string | null {
  if (!desde || !hasta) return 'Elegí las dos fechas.';
  if (desde > hasta) return 'La fecha desde no puede ser posterior a hasta.';
  const dias = Math.round((Date.parse(hasta) - Date.parse(desde)) / DIA) + 1;
  if (dias > MAXIMO_DIAS) return 'El rango puede ser de hasta un año.';
  return null;
}

@Component({
  selector: 'app-selector-rango',
  template: `
    <div class="selector">
      <div class="atajos" role="group" aria-label="Rangos rápidos">
        @for (atajo of atajos; track atajo.dias) {
          <button
            type="button"
            [class.activo]="atajoActivo() === atajo.dias"
            [attr.aria-pressed]="atajoActivo() === atajo.dias"
            (click)="elegirAtajo(atajo.dias)"
          >
            {{ atajo.texto }}
          </button>
        }
      </div>
      <div class="fechas">
        <label>
          <span class="sr-only">Desde</span>
          <input
            type="date"
            [value]="borrador().desde"
            [max]="hoy()"
            (change)="cambiar('desde', $event)"
            aria-label="Desde"
          />
        </label>
        <span class="meta" aria-hidden="true">→</span>
        <label>
          <span class="sr-only">Hasta</span>
          <input
            type="date"
            [value]="borrador().hasta"
            [max]="hoy()"
            (change)="cambiar('hasta', $event)"
            aria-label="Hasta"
          />
        </label>
      </div>
    </div>
    @if (problema(); as mensaje) {
      <p class="campo-error">{{ mensaje }}</p>
    }
  `,
  styles: `
    .selector {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem 0.75rem;
    }
    .atajos {
      display: inline-flex;
      padding: 0.15rem;
      gap: 0.15rem;
      background: var(--bg-subtle);
      border-radius: 8px;
    }
    .atajos button {
      padding: 0.25rem 0.6rem;
      background: transparent;
      color: var(--text-secondary);
      font-size: 13px;
      --sombra-boton: none;
    }
    .atajos button:hover {
      color: var(--text-primary);
    }
    .atajos button.activo {
      background: var(--bg-surface);
      color: var(--accent-text);
    }
    .fechas {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .fechas label {
      margin: 0;
    }
    .fechas input {
      width: auto;
      margin: 0;
      padding: 0.3rem 0.5rem;
      font-size: 13px;
    }
    .campo-error {
      margin: 0.4rem 0 0;
      font-size: 13px;
      color: var(--danger);
    }
  `,
})
export class SelectorRango {
  readonly rango = model.required<RangoFechas>();

  protected readonly atajos = ATAJOS;
  private readonly reloj = inject(RelojService);
  protected readonly hoy = computed(() => fechaArgentina(this.reloj.ahora()));
  protected readonly cambiado = signal<RangoFechas | null>(null);
  protected readonly borrador = computed(() => this.cambiado() ?? this.rango());
  protected readonly problema = computed(() => problemaDeRango(this.borrador()));
  protected readonly atajoActivo = computed(() => {
    const actual = this.borrador();
    return (
      ATAJOS.find((a) => {
        const rango = ultimosDias(a.dias, this.reloj.ahora());
        return rango.desde === actual.desde && rango.hasta === actual.hasta;
      })?.dias ?? null
    );
  });

  protected elegirAtajo(dias: number) {
    this.aplicar(ultimosDias(dias, this.reloj.ahora()));
  }

  protected cambiar(campo: keyof RangoFechas, evento: Event) {
    const valor = (evento.target as HTMLInputElement).value;
    this.aplicar({ ...this.borrador(), [campo]: valor });
  }

  private aplicar(rango: RangoFechas) {
    if (problemaDeRango(rango)) {
      this.cambiado.set(rango);
      return;
    }
    this.cambiado.set(null);
    this.rango.set(rango);
  }
}
