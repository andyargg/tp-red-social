import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { mensajeDeError } from '../core/errores';
import { Comentario } from '../core/publicacion';
import { PublicacionesService } from '../core/publicaciones.service';
import { Avatar } from './avatar';

// los últimos comentarios de una publicación, solo lectura (escribirlos llega en el sprint 3)
@Component({
  selector: 'app-comentarios',
  imports: [DatePipe, Avatar],
  template: `
    @if (error(); as mensaje) {
      <p class="meta">{{ mensaje }}</p>
    } @else if (!cargando()) {
      @for (c of comentarios(); track c._id) {
        <div class="comentario">
          <app-avatar
            [nombre]="c.autor.nombre + ' ' + c.autor.apellido"
            [imagen]="c.autor.imagenPerfil"
            tamanio="sm"
          />
          <div>
            <span class="meta">
              <strong>{{ c.autor.nombre }} {{ c.autor.apellido }}</strong>
              · {{ c.createdAt | date: 'd MMM, HH:mm' }}
              @if (c.modificado) {
                · editado
              }
            </span>
            <p>{{ c.mensaje }}</p>
          </div>
        </div>
      } @empty {
        <p class="meta">Todavía nadie comentó esta publicación.</p>
      }
      @if (total() > comentarios().length) {
        <p class="meta">y {{ total() - comentarios().length }} comentarios más</p>
      }
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--hairline);
    }
    .comentario {
      display: flex;
      gap: 0.6rem;
    }
    .comentario strong {
      color: var(--text-primary);
    }
    p {
      margin: 0.15rem 0 0;
      color: var(--text-primary);
      white-space: pre-line;
      overflow-wrap: anywhere;
    }
    p.meta {
      margin: 0;
      color: var(--text-secondary);
    }
  `,
})
export class Comentarios implements OnInit {
  private readonly servicio = inject(PublicacionesService);

  readonly publicacion = input.required<string>();
  readonly limite = input(3);

  protected readonly comentarios = signal<Comentario[]>([]);
  protected readonly total = signal(0);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit() {
    this.servicio.comentarios(this.publicacion(), 0, this.limite()).subscribe({
      next: ({ comentarios, total }) => {
        this.comentarios.set(comentarios);
        this.total.set(total);
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(`No se pudieron cargar los comentarios. ${mensajeDeError(error)}`);
        this.cargando.set(false);
      },
    });
  }
}
