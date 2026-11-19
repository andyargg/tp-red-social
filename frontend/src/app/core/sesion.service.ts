import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ModalService } from '../shared/modal/modal.service';
import { AuthService } from './auth.service';
import { mensajeDeError } from './errores';
import { vencimiento } from './jwt';

const AVISO_ANTES_DE_VENCER = 1 * 60 * 1000;
const TITULO_AVISO = 'Tu sesión está por vencer';
const TOLERANCIA_ENTRE_PESTANIAS = 2_000;

@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);
  private readonly router = inject(Router);
  private temporizadores: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    effect(() => {
      const token = this.auth.token();
      const ahora = this.auth.ahora();
      this.cancelarTemporizadores();
      this.modal.descartar(TITULO_AVISO);
      this.programarAviso(token, ahora);
    });

    const alCambiarAlmacenamiento = (evento: StorageEvent) => {
      const anterior = this.auth.token();
      const cambio = this.auth.sincronizar(evento.key);
      if (cambio === 'cerrada') {
        const vencio =
          anterior !== null &&
          (vencimiento(anterior) ?? Infinity) <= this.auth.ahora() + TOLERANCIA_ENTRE_PESTANIAS;
        this.router.navigateByUrl('/login').then(() => {
          if (vencio) this.avisarQueTermino();
        });
      }
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

  private programarAviso(token: string | null, ahora: number) {
    const vence = token ? vencimiento(token) : null;
    if (!token || !vence || vence <= ahora) return;
    const espera = Math.max(0, vence - AVISO_ANTES_DE_VENCER - ahora);
    this.temporizadores.push(
      setTimeout(() => this.avisar(token), espera),
      setTimeout(() => this.vencer(token), vence - ahora),
    );
  }

  private vencer(token: string) {
    this.modal.descartar(TITULO_AVISO);
    if (this.auth.token() !== token) return;
    this.auth.cerrarSesion();
    this.router.navigateByUrl('/login').then(() => this.avisarQueTermino());
  }

  private avisarQueTermino() {
    this.modal.abrir({
      tipo: 'info',
      titulo: 'Tu sesión terminó',
      mensaje: 'Tu sesión venció. Ingresá de nuevo para seguir.',
    });
  }

  private cancelarTemporizadores() {
    this.temporizadores.forEach(clearTimeout);
    this.temporizadores = [];
  }

  private async avisar(token: string) {
    const extender = await this.modal.confirmar({
      tipo: 'info',
      titulo: TITULO_AVISO,
      mensaje: 'Queda 1 minuto de sesión. ¿Querés extenderla?',
      textoBoton: 'Extender sesión',
      textoCancelar: 'No, gracias',
    });
    const vigente = (vencimiento(token) ?? 0) > this.auth.ahora();
    if (!extender || !vigente || this.auth.token() !== token) return;

    this.auth.refrescar().subscribe({
      next: () => {
        if (this.auth.token() === token || this.auth.token() === null) return;
        this.modal.abrir({
          tipo: 'exito',
          titulo: 'Sesión extendida',
          mensaje: 'Tu sesión dura 2 minutos más.',
        });
      },
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
