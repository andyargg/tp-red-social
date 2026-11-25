import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/errores';
import { Publicacion } from '../../core/publicacion';
import { PublicacionesService } from '../../core/publicaciones.service';
import { Avatar } from '../../shared/avatar';
import { NombreCompletoPipe } from '../../shared/pipes/nombre-completo.pipe';
import { Comentarios } from '../../shared/comentarios';
import { Icono } from '../../shared/icono';
import { PublicacionCard } from '../../shared/publicacion/publicacion';
import { EditarPerfil } from './editar-perfil';

@Component({
  selector: 'app-mi-perfil',
  imports: [
    RouterLink,
    DatePipe,
    Avatar,
    Icono,
    PublicacionCard,
    Comentarios,
    EditarPerfil,
    NombreCompletoPipe,
  ],
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
  protected readonly editando = signal(false);

  constructor() {
    this.auth.refrescarUsuario();
    const idUsuario = computed(() => this.auth.usuario()?._id);
    effect(() => {
      if (idUsuario()) untracked(() => this.cargar());
    });
  }

  protected alGuardarPerfil() {
    this.editando.set(false);
    this.cargar();
  }

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
