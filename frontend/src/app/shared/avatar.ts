import { Component, computed, input } from '@angular/core';
import { Icono } from './icono';

// foto de perfil, o las iniciales si el usuario no subió una
@Component({
  selector: 'app-avatar',
  imports: [Icono],
  template: `
    @if (imagen(); as src) {
      <img [src]="src" [alt]="'Foto de perfil de ' + nombre()" />
    } @else if (iniciales()) {
      <span aria-hidden="true">{{ iniciales() }}</span>
    } @else {
      <app-icono nombre="usuario" [tamanio]="tamanio() === 'lg' ? 32 : 16" />
    }
  `,
  host: { '[class]': "'avatar avatar-' + tamanio()" },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
      border-radius: 8px;
      background: var(--cobalt-bg);
      color: var(--cobalt);
      box-shadow: inset 0 0 0 1px rgb(37 99 235 / 0.25);
      font-weight: 600;
    }
    :host(.avatar-sm) {
      width: 34px;
      height: 34px;
      font-size: 13px;
      border-radius: 6px;
    }
    :host(.avatar-md) {
      width: 50px;
      height: 50px;
      font-size: 16px;
    }
    :host(.avatar-lg) {
      width: 96px;
      height: 96px;
      font-size: 28px;
      border-radius: 12px;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
})
export class Avatar {
  readonly nombre = input.required<string>();
  readonly imagen = input<string | null>(null);
  readonly tamanio = input<'sm' | 'md' | 'lg'>('md');

  protected readonly iniciales = computed(() =>
    this.nombre()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((palabra) => palabra[0]?.toUpperCase())
      .join(''),
  );
}
