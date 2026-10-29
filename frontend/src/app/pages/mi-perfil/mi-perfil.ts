import { DatePipe } from '@angular/common';
import { Component, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/errores';
import { Publicacion } from '../../core/publicacion';
import { PublicacionesService } from '../../core/publicaciones.service';
import { Avatar } from '../../shared/avatar';
import { Comentarios } from '../../shared/comentarios';
import { Icono } from '../../shared/icono';
import { PublicacionCard } from '../../shared/publicacion/publicacion';

@Component({
  selector: 'app-mi-perfil',
  imports: [RouterLink, DatePipe, Avatar, Icono, PublicacionCard, Comentarios],
  templateUrl: './mi-perfil.html',
  styleUrls: ['../vacio.scss', './mi-perfil.scss'],
})
export class MiPerfil {
  protected readonly auth = inject(AuthService);
  private readonly servicio = inject(PublicacionesService);

  protected readonly publicaciones = signal<Publicacion[]>([]);
  protected readonly total = signal(0);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.auth.usuario()) untracked(() => this.cargar());
    });
  }

  // mis últimas 3 publicaciones
  protected cargar() {
    const usuario = this.auth.usuario();
    if (!usuario) return;
    this.cargando.set(true);
    this.error.set(null);
    this.servicio.listar({ usuario: usuario._id, limit: 3 }).subscribe({
      next: ({ publicaciones, total }) => {
        this.publicaciones.set(publicaciones);
        this.total.set(total);
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }
}
