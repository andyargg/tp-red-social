import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/errores';
import { Publicacion } from '../../core/publicacion';
import { PublicacionesService } from '../../core/publicaciones.service';
import { Comentarios } from '../../shared/comentarios';
import { Icono } from '../../shared/icono';
import { PublicacionCard } from '../../shared/publicacion/publicacion';

@Component({
  selector: 'app-publicacion-detalle',
  imports: [RouterLink, Icono, PublicacionCard, Comentarios],
  template: `
    <section class="detalle">
      <a class="volver" routerLink="/publicaciones">
        <app-icono nombre="izquierda" [tamanio]="16" />Volver a publicaciones
      </a>

      @if (error(); as mensaje) {
        <div class="card vacio">
          <span class="icono-vacio"><app-icono nombre="alerta" [tamanio]="20" /></span>
          <strong>No se pudo abrir la publicación</strong>
          <p>{{ mensaje }}</p>
          <div class="acciones">
            <a class="button secondary" routerLink="/publicaciones">Ver todas</a>
          </div>
        </div>
      } @else if (publicacion(); as p) {
        <app-publicacion
          [publicacion]="p"
          [grande]="true"
          (actualizada)="publicacion.set($event)"
          (eliminada)="alEliminar()"
        >
          <app-comentarios
            [publicacion]="p._id"
            [limite]="5"
            [escribir]="true"
            (comentado)="sumarComentario()"
          />
        </app-publicacion>
      } @else {
        <div class="cargando" role="status"><span class="spinner"></span>Cargando publicación…</div>
      }
    </section>
  `,
  styleUrls: ['../vacio.scss'],
  styles: `
    .detalle {
      max-width: 48rem;
      margin: 0 auto;
    }
    .volver {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      margin-bottom: 1rem;
      color: var(--text-secondary);
      text-decoration: none;
    }
    .volver:hover {
      color: var(--accent-text);
    }
    .cargando {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      padding: 3rem 1rem;
      color: var(--text-secondary);
    }
    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 9999px;
      animation: spin 0.8s linear infinite;
    }
  `,
})
export class PublicacionDetalle {
  private readonly servicio = inject(PublicacionesService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  protected readonly publicacion = signal<Publicacion | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.cargar(id));
    });
  }

  private cargar(id: string) {
    this.publicacion.set(null);
    this.error.set(null);
    this.servicio.obtener(id).subscribe({
      next: (publicacion) => {
        if (this.id() === id) this.publicacion.set(publicacion);
      },
      error: (error) => {
        if (this.id() === id) this.error.set(mensajeDeError(error));
      },
    });
  }

  protected sumarComentario() {
    this.publicacion.update((p) => p && { ...p, cantidadComentarios: p.cantidadComentarios + 1 });
  }

  protected alEliminar() {
    this.router.navigateByUrl('/publicaciones');
  }
}
