import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/errores';
import { Orden, Publicacion } from '../../core/publicacion';
import { PublicacionesService } from '../../core/publicaciones.service';
import { Icono } from '../../shared/icono';
import { PublicacionCard } from '../../shared/publicacion/publicacion';
import { NuevaPublicacion } from './nueva-publicacion';

const POR_PAGINA = 5;

@Component({
  selector: 'app-publicaciones',
  imports: [RouterLink, Icono, PublicacionCard, NuevaPublicacion],
  templateUrl: './publicaciones.html',
  styleUrls: ['../vacio.scss', './publicaciones.scss'],
})
export class Publicaciones {
  protected readonly auth = inject(AuthService);
  private readonly servicio = inject(PublicacionesService);

  protected readonly orden = signal<Orden>('fecha');
  protected readonly pagina = signal(1);
  protected readonly publicaciones = signal<Publicacion[]>([]);
  protected readonly total = signal(0);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly escribiendo = signal(false);

  // cada pedido tiene un número: si llega una respuesta vieja (otro orden u otra página), se descarta
  private ultimoPedido = 0;

  protected readonly paginas = computed(() => Math.max(1, Math.ceil(this.total() / POR_PAGINA)));

  constructor() {
    // vuelve a pedir el listado cada vez que cambia el orden, la página o la sesión
    effect(() => {
      const orden = this.orden();
      const pagina = this.pagina();
      if (!this.auth.logueado()) return;
      untracked(() => this.cargar(orden, pagina));
    });
  }

  protected ordenarPor(orden: Orden) {
    if (orden === this.orden()) return;
    this.orden.set(orden);
    this.pagina.set(1);
  }

  protected irA(pagina: number) {
    this.pagina.set(pagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // la nueva publicación es la más reciente: se muestra la primera página por fecha
  protected alPublicar() {
    this.escribiendo.set(false);
    if (this.orden() === 'fecha' && this.pagina() === 1) this.recargar();
    this.orden.set('fecha');
    this.pagina.set(1);
  }

  protected alEliminar() {
    // si era la única de la última página, retrocede una
    if (this.publicaciones().length === 1 && this.pagina() > 1) {
      this.pagina.update((p) => p - 1);
    } else {
      this.recargar();
    }
  }

  protected recargar() {
    this.cargar(this.orden(), this.pagina());
  }

  private cargar(orden: Orden, pagina: number) {
    const pedido = ++this.ultimoPedido;
    this.cargando.set(true);
    this.error.set(null);
    this.servicio
      .listar({ orden, offset: (pagina - 1) * POR_PAGINA, limit: POR_PAGINA })
      .subscribe({
        next: ({ publicaciones, total }) => {
          if (pedido !== this.ultimoPedido) return;
          // si la página dejó de existir (se eliminaron publicaciones), va a la última
          const ultima = Math.max(1, Math.ceil(total / POR_PAGINA));
          if (pagina > ultima) {
            this.pagina.set(ultima);
            return;
          }
          this.publicaciones.set(publicaciones);
          this.total.set(total);
          this.cargando.set(false);
        },
        error: (error) => {
          if (pedido !== this.ultimoPedido) return;
          this.error.set(mensajeDeError(error));
          this.cargando.set(false);
        },
      });
  }
}
