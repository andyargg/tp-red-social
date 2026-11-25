import { formatDate } from '@angular/common';
import { Component, LOCALE_ID, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { mensajeDeError } from '../../../core/errores';
import { EstadisticasService, RangoFechas } from '../../../core/estadisticas.service';
import { Grafico } from '../../../shared/grafico';
import { NombreCompletoPipe } from '../../../shared/pipes/nombre-completo.pipe';
import { PluralPipe } from '../../../shared/pipes/plural.pipe';
import { SelectorRango, ultimosDias } from './selector-rango';

@Component({
  selector: 'app-dashboard-estadisticas',
  imports: [Grafico, SelectorRango, PluralPipe],
  templateUrl: './dashboard-estadisticas.html',
  styleUrl: './dashboard-estadisticas.scss',
})
export class DashboardEstadisticas {
  private readonly servicio = inject(EstadisticasService);
  private readonly locale = inject(LOCALE_ID);
  private readonly nombreCompleto = new NombreCompletoPipe();

  protected readonly rangoPublicaciones = signal<RangoFechas>(ultimosDias(30));
  protected readonly rangoComentarios = signal<RangoFechas>(ultimosDias(30));
  protected readonly rangoPorPublicacion = signal<RangoFechas>(ultimosDias(30));

  protected readonly publicaciones = rxResource({
    params: () => this.rangoPublicaciones(),
    stream: ({ params }) => this.servicio.publicacionesPorUsuario(params),
  });
  protected readonly comentarios = rxResource({
    params: () => this.rangoComentarios(),
    stream: ({ params }) => this.servicio.comentariosPorDia(params),
  });
  protected readonly porPublicacion = rxResource({
    params: () => this.rangoPorPublicacion(),
    stream: ({ params }) => this.servicio.comentariosPorPublicacion(params),
  });

  protected readonly filasPublicaciones = computed(() =>
    (this.publicaciones.value()?.datos ?? []).map((d) => ({
      etiqueta: `${this.nombreCompleto.transform(d.usuario)} (@${d.usuario.nombreUsuario})`,
      cantidad: d.cantidad,
    })),
  );
  protected readonly etiquetasPublicaciones = computed(() =>
    this.filasPublicaciones().map((f) => f.etiqueta),
  );
  protected readonly valoresPublicaciones = computed(() =>
    this.filasPublicaciones().map((f) => f.cantidad),
  );
  protected readonly totalPublicaciones = computed(() =>
    this.filasPublicaciones().reduce((suma, f) => suma + f.cantidad, 0),
  );

  protected readonly filasComentarios = computed(() =>
    (this.comentarios.value()?.porDia ?? []).map((d) => {
      const [anio, mes, dia] = d.fecha.split('-').map(Number);
      return {
        etiqueta: formatDate(new Date(anio, mes - 1, dia), 'd MMM', this.locale),
        cantidad: d.cantidad,
      };
    }),
  );
  protected readonly etiquetasComentarios = computed(() =>
    this.filasComentarios().map((f) => f.etiqueta),
  );
  protected readonly valoresComentarios = computed(() =>
    this.filasComentarios().map((f) => f.cantidad),
  );
  protected readonly maximoPorDia = computed(() =>
    Math.max(0, ...this.filasComentarios().map((f) => f.cantidad)),
  );

  protected readonly filasPorPublicacion = computed(() =>
    (this.porPublicacion.value()?.datos ?? []).map((d) => ({
      etiqueta: d.publicacion.titulo,
      cantidad: d.cantidad,
    })),
  );
  protected readonly etiquetasPorPublicacion = computed(() =>
    this.filasPorPublicacion().map((f) => f.etiqueta),
  );
  protected readonly valoresPorPublicacion = computed(() =>
    this.filasPorPublicacion().map((f) => f.cantidad),
  );
  protected readonly alturaBarras = computed(
    () => `${Math.max(12, this.filasPorPublicacion().length * 2.25 + 4)}rem`,
  );

  protected mensaje(error: unknown) {
    return mensajeDeError(error);
  }
}
