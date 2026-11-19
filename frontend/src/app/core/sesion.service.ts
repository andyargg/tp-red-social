import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ModalService } from '../shared/modal/modal.service';
import { AuthService } from './auth.service';
import { mensajeDeError } from './errores';
import { vencimiento } from './jwt';

const AVISO_ANTES_DE_VENCER = 1 * 60 * 1000;
const TITULO_AVISO = 'Tu sesión está por vencer';

@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);
  private readonly router = inject(Router);
  private temporizadores: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    effect(() => {
      const token = this.auth.token();
      this.cancelarTemporizadores();
      this.modal.descartar(TITULO_AVISO);
      this.programarAviso(token);
    });

    const alCambiarAlmacenamiento = (evento: StorageEvent) => {
      const cambio = this.auth.sincronizar(evento.key);
      if (cambio === 'cerrada') this.router.navigateByUrl('/login');
      if (cambio === 'otroUsuario') {
        this.router.navigate(['/cargando'], { queryParams: { destino: this.router.url } });
      }
    };
    window.addEventListener('storage', alCambiarAlmacenamiento);
    inject(DestroyRef).onDestroy(() => {
      this.cancelarTemporizadores();
      window.removeEventListener('storage', alCambiarAlmacenamiento);
    });
  }

  private programarAviso(token: string | null) {
    const vence = token ? vencimiento(token) : null;
    if (!token || !vence || vence <= Date.now()) return;
    const espera = Math.max(0, vence - AVISO_ANTES_DE_VENCER - Date.now());
    this.temporizadores.push(
      setTimeout(() => this.avisar(token), espera),
      setTimeout(() => this.modal.descartar(TITULO_AVISO), vence - Date.now()),
    );
  }

  private cancelarTemporizadores() {
    this.temporizadores.forEach(clearTimeout);
    this.temporizadores = [];
  }

  private async avisar(token: string) {
    const extender = await this.modal.confirmar({
      tipo: 'info',
      titulo: TITULO_AVISO,
      mensaje: 'Quedan 5 minutos de sesión. ¿Querés extenderla?',
      textoBoton: 'Extender sesión',
      textoCancelar: 'No, gracias',
    });
    const vigente = (vencimiento(token) ?? 0) > Date.now();
    if (!extender || !vigente || this.auth.token() !== token) return;

    this.auth.refrescar().subscribe({
      next: () =>
        this.modal.abrir({
          tipo: 'exito',
          titulo: 'Sesión extendida',
          mensaje: 'Tu sesión dura 15 minutos más.',
        }),
      error: (error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) return;
        this.modal.abrir({
          tipo: 'error',
          titulo: 'No se pudo extender la sesión',
          mensaje: mensajeDeError(error),
        });
      },
    });
  }
}
