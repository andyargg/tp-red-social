import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { Icono } from '../icono';
import { ModalService } from './modal.service';

const ICONOS = { exito: 'check', error: 'alerta', info: 'info' } as const;

@Component({
  selector: 'app-modal',
  imports: [Icono],
  template: `
    <dialog #dialogo (close)="modal.cerrar()" [class]="'modal-' + (datos()?.tipo ?? 'info')">
      @if (datos(); as d) {
        <div class="encabezado">
          <span class="icono"><app-icono [nombre]="iconos[d.tipo ?? 'info']" /></span>
          <h2>{{ d.titulo }}</h2>
        </div>
        <p>{{ d.mensaje }}</p>
        <div class="dialog-actions">
          <button type="button" (click)="dialogo.close()" autofocus>{{ d.textoBoton }}</button>
        </div>
      }
    </dialog>
  `,
  styles: `
    .encabezado {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }
    h2 {
      margin: 0;
    }
    p {
      margin: 0;
      white-space: pre-line;
    }
    .icono {
      display: inline-flex;
      padding: 0.5rem;
      border-radius: 8px;
      background: var(--cobalt-bg);
      color: var(--cobalt);
    }
    .modal-exito .icono {
      background: var(--ok-bg);
      color: var(--ok);
    }
    .modal-error .icono {
      background: var(--danger-bg);
      color: var(--danger);
    }
  `,
})
export class Modal {
  protected readonly modal = inject(ModalService);
  protected readonly datos = this.modal.actual;
  protected readonly iconos = ICONOS;
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    effect(() => {
      const dialogo = this.dialogo().nativeElement;
      if (this.datos() && !dialogo.open) dialogo.showModal();
      if (!this.datos() && dialogo.open) dialogo.close();
    });
  }
}
