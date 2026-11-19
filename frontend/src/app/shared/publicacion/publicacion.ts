import { DatePipe, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/errores';
import { Publicacion } from '../../core/publicacion';
import { PublicacionesService } from '../../core/publicaciones.service';
import { Avatar } from '../avatar';
import { Icono } from '../icono';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'app-publicacion',
  imports: [DatePipe, RouterLink, Avatar, Icono],
  templateUrl: './publicacion.html',
  styleUrl: './publicacion.scss',
})
export class PublicacionCard {
  private readonly auth = inject(AuthService);
  private readonly servicio = inject(PublicacionesService);
  private readonly modal = inject(ModalService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly publicacion = input.required<Publicacion>();
  readonly grande = input(false);
  readonly eliminada = output<string>();
  readonly actualizada = output<Publicacion>();

  protected readonly datos = linkedSignal(() => this.publicacion());
  protected readonly procesando = signal(false);
  protected readonly latido = signal(false);
  protected readonly esMia = computed(() => this.auth.usuario()?._id === this.datos().autor._id);
  protected readonly puedoEliminar = computed(
    () => this.esMia() || this.auth.usuario()?.perfil === 'administrador',
  );

  protected abrir(evento: MouseEvent) {
    if (this.grande()) return;
    const destino = evento.target as HTMLElement | null;
    if (destino?.closest('a, button, input, textarea, select, label, .proyectado')) return;
    if (window.getSelection()?.toString()) return;
    const ruta = ['/publicaciones', this.datos()._id];
    if (evento.ctrlKey || evento.metaKey || evento.shiftKey) {
      const url = this.location.prepareExternalUrl(
        this.router.serializeUrl(this.router.createUrlTree(ruta)),
      );
      window.open(url, '_blank', 'noopener');
      return;
    }
    this.router.navigate(ruta);
  }

  protected alternarMeGusta() {
    const { _id, meGustaYo } = this.datos();
    this.procesando.set(true);
    const pedido = meGustaYo ? this.servicio.quitarMeGusta(_id) : this.servicio.darMeGusta(_id);
    pedido.subscribe({
      next: (actualizada) => {
        this.datos.set(actualizada);
        this.actualizada.emit(actualizada);
        this.procesando.set(false);
        this.latido.set(actualizada.meGustaYo);
      },
      error: (error) => {
        this.procesando.set(false);
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.datos.update((p) => ({
            ...p,
            meGustaYo: !meGustaYo,
            cantidadMeGusta: Math.max(0, p.cantidadMeGusta + (meGustaYo ? -1 : 1)),
          }));
          this.actualizada.emit(this.datos());
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
