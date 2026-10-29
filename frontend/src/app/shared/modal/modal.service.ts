import { Injectable, signal } from '@angular/core';

export type TipoModal = 'exito' | 'error' | 'info';

export interface DatosModal {
  titulo: string;
  mensaje: string;
  tipo?: TipoModal;
  textoBoton?: string;
}

// reemplaza a alert(): un único modal para toda la app, montado en App
@Injectable({ providedIn: 'root' })
export class ModalService {
  readonly actual = signal<DatosModal | null>(null);
  private alCerrar?: () => void;

  abrir(datos: DatosModal): Promise<void> {
    this.alCerrar?.();
    this.actual.set({ tipo: 'info', textoBoton: 'Aceptar', ...datos });
    return new Promise((resolve) => (this.alCerrar = resolve));
  }

  cerrar() {
    this.actual.set(null);
    this.alCerrar?.();
    this.alCerrar = undefined;
  }
}
