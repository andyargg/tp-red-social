import { DatePipe } from '@angular/common';
import { AutofocoDirective } from './directivas/autofoco.directive';
import { NombreCompletoPipe } from './pipes/nombre-completo.pipe';
import { RelojService } from './pipes/reloj.service';
import { TiempoRelativoPipe } from './pipes/tiempo-relativo.pipe';
import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { mensajeDeError } from '../core/errores';
import { Comentario } from '../core/publicacion';
import { PublicacionesService } from '../core/publicaciones.service';
import { Avatar } from './avatar';
import { Icono } from './icono';
import { ModalService } from './modal/modal.service';
import { obligatorio } from './validadores';

const MAXIMO_COMENTARIO = 500;

@Component({
  selector: 'app-comentarios',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    Avatar,
    Icono,
    AutofocoDirective,
    NombreCompletoPipe,
    TiempoRelativoPipe,
  ],
  template: `
    @if (escribir()) {
      <form class="nuevo" [formGroup]="form" (ngSubmit)="comentar()" novalidate>
        <label class="sr-only" for="nuevoComentario-{{ publicacion() }}"
          >Escribí un comentario</label
        >
        <textarea
          id="nuevoComentario-{{ publicacion() }}"
          rows="2"
          formControlName="mensaje"
          [maxlength]="maximo"
          placeholder="Escribí un comentario…"
        ></textarea>
        <div class="pie-form">
          @if (form.controls.mensaje.touched && form.controls.mensaje.invalid) {
            <p class="campo-error">Escribí algo antes de comentar.</p>
          } @else {
            <p class="ayuda">{{ form.controls.mensaje.value.length }}/{{ maximo }}</p>
          }
          <button type="submit" class="small" [disabled]="enviando()">
            <app-icono nombre="enviar" [tamanio]="14" />{{ enviando() ? 'Enviando…' : 'Comentar' }}
          </button>
        </div>
      </form>
    }

    @if (error(); as mensaje) {
      <p class="meta">{{ mensaje }}</p>
    } @else if (!cargando()) {
      @for (c of comentarios(); track c._id) {
        <div class="comentario">
          <app-avatar
            [nombre]="c.autor | nombreCompleto"
            [imagen]="c.autor.imagenPerfil"
            tamanio="sm"
          />
          <div class="cuerpo">
            <span class="meta">
              <strong>{{ c.autor | nombreCompleto }}</strong>
              ·
              <time [attr.datetime]="c.createdAt" [title]="c.createdAt | date: 'd MMM y, HH:mm'">{{
                c.createdAt | tiempoRelativo: reloj.ahora()
              }}</time>
              @if (c.modificado) {
                · <span class="editado">editado</span>
              }
            </span>
            @if (editando() === c._id) {
              <form
                class="edicion"
                [formGroup]="formEdicion"
                (ngSubmit)="guardarEdicion(c)"
                novalidate
              >
                <label class="sr-only" for="editar-{{ c._id }}">Editar comentario</label>
                <textarea
                  id="editar-{{ c._id }}"
                  appAutofoco
                  rows="2"
                  formControlName="mensaje"
                  [maxlength]="maximo"
                ></textarea>
                @if (formEdicion.controls.mensaje.invalid) {
                  <p class="campo-error">El comentario no puede quedar vacío.</p>
                }
                <div class="acciones">
                  <button type="button" class="secondary small" (click)="editando.set(null)">
                    Cancelar
                  </button>
                  <button type="submit" class="small" [disabled]="enviando()">
                    {{ enviando() ? 'Guardando…' : 'Guardar' }}
                  </button>
                </div>
              </form>
            } @else {
              <p>{{ c.mensaje }}</p>
              @if (c.autor._id === auth.usuario()?._id) {
                <button type="button" class="editar" (click)="editar(c)">
                  <app-icono nombre="lapiz" [tamanio]="12" />Editar
                </button>
              }
            }
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
              : 'Cargar más comentarios (' + (total() - comentarios().length) + ')'
          }}
        </button>
      }
    } @else {
      <p class="meta">Cargando comentarios…</p>
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
    .cuerpo {
      flex: 1;
      min-width: 0;
    }
    .comentario strong {
      color: var(--text-primary);
    }
    .editado {
      color: var(--accent-text);
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
    textarea {
      resize: vertical;
      margin-top: 0;
    }
    .pie-form,
    .acciones {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-top: 0.4rem;
    }
    .acciones {
      justify-content: flex-end;
    }
    .pie-form p,
    .edicion p {
      margin: 0;
      font-size: 14px;
    }
    .ayuda {
      color: var(--text-secondary);
    }
    .campo-error {
      color: var(--danger);
    }
    .editar {
      margin-top: 0.15rem;
      padding: 0.1rem 0;
      gap: 0.25rem;
      background: none;
      color: var(--text-secondary);
      font-size: 13px;
      --sombra-boton: none;
    }
    .editar:hover {
      background: none;
      color: var(--accent-text);
    }
  `,
})
export class Comentarios implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly reloj = inject(RelojService);
  private readonly servicio = inject(PublicacionesService);
  private readonly modal = inject(ModalService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly publicacion = input.required<string>();
  readonly limite = input(3);
  readonly escribir = input(false);
  readonly comentado = output<Comentario>();

  protected readonly maximo = MAXIMO_COMENTARIO;
  protected readonly comentarios = signal<Comentario[]>([]);
  protected readonly total = signal(0);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly cargandoMas = signal(false);
  protected readonly enviando = signal(false);
  protected readonly editando = signal<string | null>(null);

  protected readonly form = this.fb.group({
    mensaje: ['', [obligatorio, Validators.maxLength(MAXIMO_COMENTARIO)]],
  });
  protected readonly formEdicion = this.fb.group({
    mensaje: ['', [obligatorio, Validators.maxLength(MAXIMO_COMENTARIO)]],
  });

  ngOnInit() {
    this.cargar();
  }

  protected cargar() {
    this.cargandoMas.set(true);
    this.servicio
      .comentarios(this.publicacion(), this.comentarios().length, this.limite())
      .subscribe({
        next: ({ comentarios, total }) => {
          this.comentarios.update((anteriores) => {
            const vistos = new Set(anteriores.map((c) => c._id));
            return [...anteriores, ...comentarios.filter((c) => !vistos.has(c._id))];
          });
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

  protected comentar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.servicio.comentar(this.publicacion(), this.form.getRawValue().mensaje.trim()).subscribe({
      next: (comentario) => {
        this.comentarios.update((lista) => [comentario, ...lista]);
        this.total.update((total) => total + 1);
        this.form.reset();
        this.enviando.set(false);
        this.comentado.emit(comentario);
      },
      error: (error) => {
        this.enviando.set(false);
        this.modal.abrir({
          tipo: 'error',
          titulo: 'No se pudo comentar',
          mensaje: mensajeDeError(error),
        });
      },
    });
  }

  protected editar(comentario: Comentario) {
    this.formEdicion.setValue({ mensaje: comentario.mensaje });
    this.editando.set(comentario._id);
  }

  protected guardarEdicion(comentario: Comentario) {
    if (this.formEdicion.invalid) return;
    const mensaje = this.formEdicion.getRawValue().mensaje.trim();
    if (mensaje === comentario.mensaje) {
      this.editando.set(null);
      return;
    }
    this.enviando.set(true);
    this.servicio.editarComentario(this.publicacion(), comentario._id, mensaje).subscribe({
      next: (editado) => {
        this.comentarios.update((lista) => lista.map((c) => (c._id === editado._id ? editado : c)));
        this.editando.set(null);
        this.enviando.set(false);
      },
      error: (error) => {
        this.enviando.set(false);
        this.modal.abrir({
          tipo: 'error',
          titulo: 'No se pudo editar el comentario',
          mensaje: mensajeDeError(error),
        });
      },
    });
  }
}
