import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { AuthService } from '../../../core/auth.service';
import { mensajeDeError } from '../../../core/errores';
import { Usuario } from '../../../core/usuario';
import { UsuariosService } from '../../../core/usuarios.service';
import { Avatar } from '../../../shared/avatar';
import { FormularioUsuario } from '../../../shared/formulario-usuario/formulario-usuario';
import { Icono } from '../../../shared/icono';
import { ModalService } from '../../../shared/modal/modal.service';
import { NombreCompletoPipe } from '../../../shared/pipes/nombre-completo.pipe';
import { PluralPipe } from '../../../shared/pipes/plural.pipe';

type Filtro = 'todos' | 'activos' | 'deshabilitados';

@Component({
  selector: 'app-dashboard-usuarios',
  imports: [DatePipe, Avatar, Icono, FormularioUsuario, NombreCompletoPipe, PluralPipe],
  templateUrl: './dashboard-usuarios.html',
  styleUrl: './dashboard-usuarios.scss',
})
export class DashboardUsuarios {
  private readonly servicio = inject(UsuariosService);
  private readonly modal = inject(ModalService);
  protected readonly auth = inject(AuthService);
  private readonly formulario = viewChild(FormularioUsuario);

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly creando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly procesando = signal<ReadonlySet<string>>(new Set());
  protected readonly filtro = signal<Filtro>('todos');
  protected readonly busqueda = signal('');

  protected readonly visibles = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.usuarios().filter((u) => {
      if (this.filtro() === 'activos' && !u.activo) return false;
      if (this.filtro() === 'deshabilitados' && u.activo) return false;
      if (!texto) return true;
      return [u.nombre, u.apellido, u.nombreUsuario, u.correo].some((campo) =>
        campo.toLowerCase().includes(texto),
      );
    });
  });
  protected readonly cantidadDeshabilitados = computed(
    () => this.usuarios().filter((u) => !u.activo).length,
  );

  constructor() {
    this.cargar();
  }

  protected cargar() {
    this.cargando.set(true);
    this.error.set(null);
    this.servicio.listar().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  protected crear(datos: FormData) {
    this.guardando.set(true);
    this.servicio.crear(datos).subscribe({
      next: (usuario) => {
        this.guardando.set(false);
        this.usuarios.update((lista) => [usuario, ...lista]);
        this.formulario()?.reiniciar();
        this.creando.set(false);
        this.modal.abrir({
          tipo: 'exito',
          titulo: 'Usuario creado',
          mensaje: `${usuario.nombre} ${usuario.apellido} ya puede ingresar como ${
            usuario.perfil === 'administrador' ? 'administrador' : 'usuario'
          }.`,
        });
      },
      error: (error) => {
        this.guardando.set(false);
        this.modal.abrir({
          tipo: 'error',
          titulo: 'No se pudo crear el usuario',
          mensaje: mensajeDeError(error),
        });
      },
    });
  }

  protected async cambiarEstado(usuario: Usuario) {
    const deshabilitar = usuario.activo;
    const nombre = `${usuario.nombre} ${usuario.apellido}`;
    const confirmado = await this.modal.confirmar(
      deshabilitar
        ? {
            tipo: 'error',
            titulo: '¿Deshabilitar usuario?',
            mensaje: `${nombre} no va a poder ingresar a Socialito hasta que lo vuelvas a habilitar.`,
            textoBoton: 'Deshabilitar',
            peligroso: true,
          }
        : {
            tipo: 'info',
            titulo: '¿Habilitar usuario?',
            mensaje: `${nombre} va a poder volver a ingresar a Socialito.`,
            textoBoton: 'Habilitar',
          },
    );
    if (!confirmado) return;

    this.marcar(usuario._id, true);
    const pedido = deshabilitar
      ? this.servicio.deshabilitar(usuario._id)
      : this.servicio.habilitar(usuario._id);
    pedido.subscribe({
      next: (actualizado) => {
        this.marcar(usuario._id, false);
        this.usuarios.update((lista) =>
          lista.map((u) => (u._id === actualizado._id ? actualizado : u)),
        );
      },
      error: (error) => {
        this.marcar(usuario._id, false);
        if (error instanceof HttpErrorResponse && error.status === 404) this.cargar();
        this.modal.abrir({
          tipo: 'error',
          titulo: deshabilitar ? 'No se pudo deshabilitar' : 'No se pudo habilitar',
          mensaje: mensajeDeError(error),
        });
      },
    });
  }

  private marcar(id: string, enCurso: boolean) {
    this.procesando.update((actual) => {
      const nuevo = new Set(actual);
      if (enCurso) nuevo.add(id);
      else nuevo.delete(id);
      return nuevo;
    });
  }

  protected buscar(evento: Event) {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }
}
