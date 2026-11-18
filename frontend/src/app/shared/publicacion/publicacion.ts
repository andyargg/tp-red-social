import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/errores';
import { Publicacion } from '../../core/publicacion';
import { PublicacionesService } from '../../core/publicaciones.service';
import { Avatar } from '../avatar';
import { Icono } from '../icono';
import { ModalService } from '../modal/modal.service';

// tarjeta de una publicación: me gusta y baja (de las propias, o de cualquiera si soy administrador).
// lo que se proyecta adentro (por ejemplo, los comentarios) va al pie de la tarjeta
@Component({
  selector: 'app-publicacion',
  imports: [DatePipe, Avatar, Icono],
  templateUrl: './publicacion.html',
  styleUrl: './publicacion.scss',
})
export class PublicacionCard {
  private readonly auth = inject(AuthService);
  private readonly servicio = inject(PublicacionesService);
  private readonly modal = inject(ModalService);

  readonly publicacion = input.required<Publicacion>();
  readonly eliminada = output<string>();

  // copia local que se actualiza con la respuesta del me gusta
  protected readonly datos = linkedSignal(() => this.publicacion());
  protected readonly procesando = signal(false);
  // true solo un instante después de dar me gusta, para animar el corazón
  protected readonly latido = signal(false);
  protected readonly esMia = computed(() => this.auth.usuario()?._id === this.datos().autor._id);
  protected readonly puedoEliminar = computed(
    () => this.esMia() || this.auth.usuario()?.perfil === 'administrador',
  );

  protected alternarMeGusta() {
    const { _id, meGustaYo } = this.datos();
    this.procesando.set(true);
    const pedido = meGustaYo ? this.servicio.quitarMeGusta(_id) : this.servicio.darMeGusta(_id);
    pedido.subscribe({
      next: (actualizada) => {
        this.datos.set(actualizada);
        this.procesando.set(false);
        this.latido.set(actualizada.meGustaYo);
      },
      error: (error) => {
        this.procesando.set(false);
        // 409: el me gusta ya estaba en ese estado (por ejemplo, desde otra pestaña); se sincroniza
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.datos.update((p) => ({
            ...p,
            meGustaYo: !meGustaYo,
            cantidadMeGusta: Math.max(0, p.cantidadMeGusta + (meGustaYo ? -1 : 1)),
          }));
          return;
        }
        this.modal.abrir({
          tipo: 'error',
          titulo: 'No se pudo actualizar el me gusta',
          mensaje: mensajeDeError(error),
        });
      },
    });
  }

  protected async eliminar() {
    const { _id, titulo } = this.datos();
    const confirmado = await this.modal.confirmar({
      tipo: 'error',
      titulo: '¿Eliminar la publicación?',
      mensaje: `"${titulo}" dejará de verse en la red. Esta acción no se puede deshacer.`,
      textoBoton: 'Eliminar',
      peligroso: true,
    });
    if (!confirmado) return;

    this.procesando.set(true);
    this.servicio.eliminar(_id).subscribe({
      next: () => {
        this.eliminada.emit(_id);
        this.modal.abrir({
          tipo: 'exito',
          titulo: 'Publicación eliminada',
          mensaje: this.esMia()
            ? 'Tu publicación ya no está visible.'
            : 'La publicación ya no está visible para nadie.',
        });
      },
      error: (error) => {
        this.procesando.set(false);
        this.modal.abrir({
          tipo: 'error',
          titulo: 'No se pudo eliminar',
          mensaje: mensajeDeError(error),
        });
      },
    });
  }
}
