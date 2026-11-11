import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { mensajeDeError } from '../core/errores';
import { Comentario } from '../core/publicacion';
import { PublicacionesService } from '../core/publicaciones.service';
import { Avatar } from './avatar';

// comentarios de una publicación, los más recientes primero y de a tandas con "Ver más";
// solo lectura (escribirlos llega en el sprint 3)
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
        <button type="button" class="secondary small" (click)="cargar()" [disabled]="cargandoMas()">
          {{
            cargandoMas()
              ? 'Cargando…'
              : 'Ver más comentarios (' + (total() - comentarios().length) + ')'
          }}
        </button>
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
    button {
      align-self: flex-start;
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
  protected readonly cargandoMas = signal(false);

  ngOnInit() {
    this.cargar();
  }

  // trae la siguiente tanda y la agrega debajo de las anteriores
  protected cargar() {
    this.cargandoMas.set(true);
    this.servicio
      .comentarios(this.publicacion(), this.comentarios().length, this.limite())
      .subscribe({
        next: ({ comentarios, total }) => {
          this.comentarios.update((anteriores) => [...anteriores, ...comentarios]);
          this.total.set(total);
          this.cargando.set(false);
          this.cargandoMas.set(false);
        },
        error: (error) => {
          this.error.set(`No se pudieron cargar los comentarios. ${mensajeDeError(error)}`);
          this.cargando.set(false);
          this.cargandoMas.set(false);
        },
      });
  }
}
