import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

export type TipoGrafico = 'torta' | 'linea' | 'barras';

export const COLORES_CATEGORIAS = [
  '#257de0',
  '#f47230',
  '#00b894',
  '#f2a600',
  '#ee7fac',
  '#008a17',
];
export const COLOR_OTROS = '#94a3b8';
const COLOR_LINEA = '#ea580c';
const COLOR_BARRAS = '#2563eb';
const COLOR_GRILLA = '#e2e8f0';
const COLOR_TEXTO = '#526077';
const MAXIMO_PORCIONES = COLORES_CATEGORIAS.length;
const LARGO_ETIQUETA = 26;

export interface Porcion {
  etiqueta: string;
  valor: number;
  color: string;
}

export function agruparPorciones(etiquetas: string[], valores: number[]): Porcion[] {
  const porciones = etiquetas.map((etiqueta, i) => ({ etiqueta, valor: valores[i] ?? 0 }));
  const visibles =
    porciones.length > MAXIMO_PORCIONES ? porciones.slice(0, MAXIMO_PORCIONES - 1) : porciones;
  const resultado = visibles.map((p, i) => ({ ...p, color: COLORES_CATEGORIAS[i] }));
  if (porciones.length > MAXIMO_PORCIONES) {
    const resto = porciones.slice(MAXIMO_PORCIONES - 1);
    resultado.push({
      etiqueta: `Otros (${resto.length})`,
      valor: resto.reduce((suma, p) => suma + p.valor, 0),
      color: COLOR_OTROS,
    });
  }
  return resultado;
}

function acortar(texto: string) {
  return texto.length > LARGO_ETIQUETA ? `${texto.slice(0, LARGO_ETIQUETA - 1)}…` : texto;
}

@Component({
  selector: 'app-grafico',
  host: { '(window:resize)': 'alRedimensionar()' },
  template: `<div class="lienzo" [style.height]="alto() || altoPorDefecto()">
    <canvas #lienzo role="img" [attr.aria-label]="descripcion()"></canvas>
  </div>`,
  styles: `
    :host {
      display: block;
    }
    .lienzo {
      position: relative;
    }
  `,
})
export class Grafico {
  readonly tipo = input.required<TipoGrafico>();
  readonly etiquetas = input.required<string[]>();
  readonly valores = input.required<number[]>();
  readonly nombreSerie = input('Cantidad');
  readonly descripcion = input('');
  readonly alto = input('');

  private readonly lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  private grafico: Chart | null = null;
  private readonly ancho = signal(typeof window === 'undefined' ? 1024 : window.innerWidth);
  private readonly angosto = computed(() => this.ancho() < 640);
  protected readonly altoPorDefecto = computed(() =>
    this.tipo() !== 'torta' ? '18rem' : this.angosto() ? '24rem' : '16rem',
  );

  private readonly configuracion = computed((): ChartConfiguration => {
    const tipo = this.tipo();
    const etiquetas = this.etiquetas();
    const valores = this.valores();
    const fuente = { family: 'Inter, ui-sans-serif, system-ui, sans-serif', size: 12 };

    if (tipo === 'torta') {
      const angosto = this.angosto();
      const porciones = agruparPorciones(etiquetas, valores);
      const torta: ChartConfiguration<'doughnut'> = {
        type: 'doughnut',
        data: {
          labels: porciones.map((p) => p.etiqueta),
          datasets: [
            {
              label: this.nombreSerie(),
              data: porciones.map((p) => p.valor),
              backgroundColor: porciones.map((p) => p.color),
              borderColor: '#ffffff',
              borderWidth: 2,
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '58%',
          plugins: {
            legend: {
              position: angosto ? 'bottom' : 'right',
              labels: { color: COLOR_TEXTO, font: fuente, boxWidth: 12, boxHeight: 12 },
            },
          },
        },
      };
      return torta as unknown as ChartConfiguration;
    }

    const linea = tipo === 'linea';
    return {
      type: linea ? 'line' : 'bar',
      data: {
        labels: etiquetas,
        datasets: [
          {
            label: this.nombreSerie(),
            data: valores,
            borderColor: linea ? COLOR_LINEA : COLOR_BARRAS,
            backgroundColor: linea ? COLOR_LINEA : COLOR_BARRAS,
            borderWidth: linea ? 2 : 0,
            borderRadius: linea ? 0 : 4,
            maxBarThickness: 22,
            pointRadius: linea ? (etiquetas.length > 45 ? 0 : 3) : 0,
            pointHoverRadius: 5,
            cubicInterpolationMode: 'monotone',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: linea ? 'x' : 'y',
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { title: (items) => etiquetas[items[0]?.dataIndex ?? 0] ?? '' },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: linea ? 'transparent' : COLOR_GRILLA },
            border: { display: false },
            ticks: {
              color: COLOR_TEXTO,
              font: fuente,
              precision: 0,
              maxRotation: 0,
              autoSkip: true,
              autoSkipPadding: 12,
            },
          },
          y: {
            beginAtZero: true,
            grid: { color: linea ? COLOR_GRILLA : 'transparent' },
            border: { display: false },
            ticks: {
              color: COLOR_TEXTO,
              font: fuente,
              precision: 0,
              callback: linea
                ? undefined
                : (valor) => acortar(etiquetas[Number(valor)] ?? String(valor)),
            },
          },
        },
      },
    };
  });

  protected alRedimensionar() {
    this.ancho.set(window.innerWidth);
  }

  constructor() {
    afterNextRender(() => {
      this.grafico = new Chart(this.lienzo().nativeElement, this.configuracion());
    });
    effect(() => {
      const configuracion = this.configuracion();
      if (!this.grafico) return;
      this.grafico.destroy();
      this.grafico = new Chart(this.lienzo().nativeElement, configuracion);
    });
    inject(DestroyRef).onDestroy(() => this.grafico?.destroy());
  }
}
