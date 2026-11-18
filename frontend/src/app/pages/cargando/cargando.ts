import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/errores';

@Component({
  selector: 'app-cargando',
  template: `
    <main class="pantalla">
      <img src="favicon.svg" alt="" width="56" height="56" />
      <p class="marca">Social<span class="marca-ito">ito</span></p>
      @if (error(); as mensaje) {
        <p class="error" role="alert">No pudimos validar tu sesión. {{ mensaje }}</p>
        <div class="acciones">
          <button type="button" (click)="validar()">Reintentar</button>
          <button type="button" class="secondary" (click)="irAlLogin()">Ir al login</button>
        </div>
      } @else {
        <span class="spinner" aria-hidden="true"></span>
        <p class="meta" role="status">Validando tu sesión…</p>
      }
    </main>
  `,
  styles: `
    .pantalla {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1rem;
      box-sizing: border-box;
      text-align: center;
    }
    .marca {
      margin: 0 0 0.75rem;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--text-primary);
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 9999px;
      animation: spin 0.8s linear infinite;
    }
    .meta {
      margin: 0;
    }
    .error {
      max-width: 26rem;
      margin: 0;
    }
    .acciones {
      display: flex;
      gap: 0.5rem;
    }
  `,
})
export class Cargando implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly destino = input<string>();
  protected readonly error = signal<string | null>(null);

  ngOnInit() {
    this.validar();
  }

  protected validar() {
    if (!this.auth.token()) {
      this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }
    this.error.set(null);
    this.auth.autorizar().subscribe({
      next: () => this.router.navigateByUrl(destinoSeguro(this.destino()), { replaceUrl: true }),
      error: (error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) return;
        this.error.set(mensajeDeError(error));
      },
    });
  }

  protected irAlLogin() {
    this.auth.cerrarSesion();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}

function destinoSeguro(destino: string | undefined): string {
  if (!destino?.startsWith('/') || destino.startsWith('//') || destino.startsWith('/cargando')) {
    return '/publicaciones';
  }
  return destino;
}
